import { readFile, writeFile, readdir, rm, rename, appendFile, stat } from 'node:fs/promises';
import type { UploadManifest, StoredChunk, UploadMetadata, StorageProvider } from '@/types';
import formidable, { type File as FormidableFile } from 'formidable';
import type { StorageMedium } from '@/types/generated/browser';
import { validateChunkMetadata } from '@/validators/files';
import type { UserWithPlan } from '@/types/database/User';
import MetadataExtractor from '@/media/MetadataExtractor';
import { cleanUpVideo } from '@/media/VideoPreprocessor';
import type { FullFile } from '@/types/database/File';
import { validateUploadMetadata } from '@/validators';
import { createReadStream } from 'node:fs';
import type Client from '@/helpers/Client';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { getIP } from '@/utils';

export const CHUNK_SIZE = 10 * 1024 * 1024;
export default async (client: Client, req: Request, user: UserWithPlan) => {
	if (user.totalStorageSize >= user.plan.maxStorageSize) throw new Error('Max storage reached');

	// Fetch the local default storage medium for instant access instead of waiting to upload to S3 / SFTP
	const defaultStorageMedium = await client.FileManager.storageManager.fetchDefaultUpload();
	if (!defaultStorageMedium) throw new Error('Default upload storage not found');

	const defaultProvider = await client.FileManager.storageManager.getProvider(defaultStorageMedium);
	if (!defaultProvider.isOnline) throw new Error('Default upload storage is offline');

	// Fetch the user's storage medium for the eventual upload
	const storage = await client.FileManager.storageManager.fetchById(user.storageId);
	if (!storage) throw new Error('Storage not found');

	// As files are uploaded in chunks, they must be handled properly (to rebuild the whole file)
	const result = await handleChunkUpload(client, req, user, storage);
	if (!result.completed) return result;

	return handleFileUpload(client, req, user, storage, defaultStorageMedium, defaultProvider, result);
};

/**
  * Handle individual chunks which makes up the full uploaded file
  * @param {Client} client Global client for database queries
  * @param {Request} req The request which has the file
  * @param {UserWithPlan} user The user uploading the file
  * @param {StorageMedium} storage Where the file is being uploaded to
  * @returns
*/
const handleChunkUpload = async (client: Client, req: Request, user: UserWithPlan, storage: StorageMedium) => {
	const form = formidable({
		allowEmptyFiles: false,
		maxFileSize: CHUNK_SIZE,
		filter: ({ mimetype }) => {
			if (!mimetype) return false;
			return !client.config.get('DISALLOWED_MIME_TYPES').some((blocked) => {
				if (blocked.endsWith('/*')) return mimetype.startsWith(blocked.slice(0, -2));
				return mimetype === blocked;
			});
		},
	});

	// Get the metadata
	const [fields, files] = await form.parse(req);
	const metadataValue = fields['metadata']?.[0];
	if (metadataValue === undefined) throw new Error('No metadata provided');

	let metadataValueParsed: unknown;
	try {
		metadataValueParsed = JSON.parse(metadataValue);
	} catch {
		throw new Error('Invalid metadata');
	}

	const metadataResult = validateUploadMetadata.safeParse(metadataValueParsed);
	if (!metadataResult.success) throw new Error('No parentId provided');
	const metadata = metadataResult.data;

	const uploadValue = fields['upload']?.[0];
	if (uploadValue === undefined) throw new Error('No upload metadata provided');

	let uploadMetadataParsed: unknown;
	try {
		uploadMetadataParsed = JSON.parse(uploadValue);
	} catch {
		throw new Error('Invalid upload metadata');
	}

	const uploadResult = validateChunkMetadata.safeParse(uploadMetadataParsed);
	if (!uploadResult.success) throw new Error('Invalid upload metadata');
	const uploadMetadata = uploadResult.data;

	const uploadedMedia = files['media']?.[0];
	if (!uploadedMedia) throw new Error('No media provided');

	const tempDir = dirname(uploadedMedia.filepath);
	const sessionKey = createHash('sha256').update(`${user.id}:${uploadMetadata.fingerprint}`).digest('hex');
	const sessionPrefix = `storage-upload-${sessionKey}`;
	const manifestPath = join(tempDir, `${sessionPrefix}-manifest.json`);

	let manifest: UploadManifest | null = null;
	try {
		manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as UploadManifest;
	} catch {
		// No manifest means this is a new upload session.
	}

	if (manifest?.status === 'completed') {
		await rm(uploadedMedia.filepath, { force: true });

		return {
			completed: true as const,
			manifest,
			tempDir,
			sessionPrefix,
			storedChunks: [] as StoredChunk[],
		};
	}

	if (manifest == null) {
		const validated = await validateChunk(client, user, storage, metadata.parentId, uploadMetadata, uploadedMedia);
		manifest = {
			fingerprint: uploadMetadata.fingerprint,
			parentId: metadata.parentId,
			targetDirectoryId: validated.directoryId,
			fileName: validated.fileName,
			totalSize: uploadMetadata.totalSize,
			totalChunks: uploadMetadata.totalChunks,
			chunkSize: uploadMetadata.chunkSize,
			mimeType: uploadedMedia.mimetype,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			status: 'uploading',
		};

		await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
	} else if (manifest.fingerprint !== uploadMetadata.fingerprint || manifest.parentId !== metadata.parentId ||
			manifest.totalSize !== uploadMetadata.totalSize || manifest.totalChunks !== uploadMetadata.totalChunks || manifest.chunkSize !== uploadMetadata.chunkSize ||
			manifest.fileName !== `${uploadedMedia.originalFilename}`.split('/').pop()) {
		await rm(uploadedMedia.filepath, { force: true });
		throw new Error('Upload session metadata does not match');
	}

	const expectedChunkSize = uploadMetadata.chunkIndex === uploadMetadata.totalChunks - 1
		? uploadMetadata.totalSize - uploadMetadata.chunkSize * (uploadMetadata.totalChunks - 1) : uploadMetadata.chunkSize;

	if (uploadedMedia.size !== expectedChunkSize) {
		await rm(uploadedMedia.filepath, { force: true });
		throw new Error('Invalid chunk size');
	}

	const actualChunkHash = await hashFile(uploadedMedia.filepath);
	const existingChunks = await getStoredChunks(tempDir, sessionPrefix);
	const existingChunk = existingChunks.find((chunk) => chunk.index === uploadMetadata.chunkIndex);
	if (existingChunk) {
		await rm(uploadedMedia.filepath, { force: true });
		if (existingChunk.hash !== actualChunkHash) throw new Error('Chunk with this index already exists with different content');
	} else {
		const chunkPath = getChunkPath(tempDir, sessionPrefix, uploadMetadata.chunkIndex, actualChunkHash);
		await rename(uploadedMedia.filepath, chunkPath);
	}

	manifest.updatedAt = new Date().toISOString();
	await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
	const storedChunks = await getStoredChunks(tempDir, sessionPrefix);
	const uploadedBytes = storedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
	const receivedChunks = storedChunks.map((chunk) => chunk.index).sort((a, b) => a - b);

	if (receivedChunks.length !== manifest.totalChunks) {
		return {
			completed: false as const,
			uploadedBytes,
			totalChunks: manifest.totalChunks,
			receivedChunks,
			uploadFingerprint: manifest.fingerprint,
		};
	}

	for (let index = 0; index < manifest.totalChunks; index++) {
		if (!storedChunks.some((chunk) => chunk.index === index)) {
			return {
				completed: false as const,
				uploadedBytes,
				totalChunks: manifest.totalChunks,
				receivedChunks,
				uploadFingerprint: manifest.fingerprint,
			};
		}
	}

	return {
		completed: true as const,
		manifest,
		tempDir,
		sessionPrefix,
		storedChunks,
	};
};

/**
  * Validate the uploaded chunk to ensure no issues from transit
  * @param {Client} client Global client for database queries
  * @param {UserWithPlan} user The user uploading the file
  * @param {StorageMedium} storage Where the file is being uploaded to
  * @param {string} parentId d
  * @param {UploadMetadata} metadata d
  * @param {FormidableFile} uploadedMedia d
*/
const validateChunk = async (client: Client, user: UserWithPlan, storage: StorageMedium, parentId: string, metadata: UploadMetadata, uploadedMedia: FormidableFile): Promise<{directoryId: string; fileName:string}> => {
	try {
		if (metadata.chunkIndex !== 0) throw new Error('Upload session has not been initialized');
		if (metadata.totalChunks !== Math.ceil(metadata.totalSize / metadata.chunkSize)) throw new Error('Invalid total chunk count');
		if (metadata.chunkSize !== CHUNK_SIZE) throw new Error('Invalid chunk size');
		if (metadata.totalSize > Number(user.plan.maxFileSize)) throw new Error('File is too large');
		if (BigInt(metadata.totalSize) + user.totalStorageSize >= user.plan.maxStorageSize) throw new Error('File is too large');
		if (BigInt(metadata.totalSize) + storage.usedSize >= storage.maxSize) throw new Error('Storage medium does not have enough space');

		// Fetch the file and validate it
		let dir = await client.FileManager.fetchById(parentId);
		if (!dir || dir.type == 'FILE') throw new Error('Missing parent directory');
		if (dir.userId !== user.id) throw new Error('You do not have access to this file');

		let fileName = `${uploadedMedia.originalFilename}`;
		const lastSlashIndex = fileName.lastIndexOf('/');
		if (lastSlashIndex > -1) {
			const folderPath = fileName.substring(0, lastSlashIndex);
			fileName = fileName.substring(lastSlashIndex + 1);
			dir = await ensureFolderExists(client, dir, user.id, folderPath, storage.id);
		}

		if (dir.children.find((file) => file.name === fileName)) throw new Error('File with that name already exists');
		return { directoryId: dir.id, fileName };
	} catch (err) {
		await rm(uploadedMedia.filepath, { force: true });
		throw err;
	}
};

/**
  *
  * @param client
  * @param req
  * @param user
  * @param storage
  * @param defaultStorageMedium
  * @param defaultProvider
  * @param result
  * @returns
*/
const handleFileUpload = async (client: Client, req: Request, user: UserWithPlan, storage: StorageMedium, defaultStorageMedium: StorageMedium, defaultProvider: StorageProvider, result: Extract<Awaited<ReturnType<typeof handleChunkUpload>>, { completed: true }>) => {
	if (result.manifest.status === 'completed') {
		return {
			completed: true,
			fileId: result.manifest.fileId,
			uploadFingerprint: result.manifest.fingerprint,
		};
	}

	const { manifest, tempDir, sessionPrefix, storedChunks } = result;
	const assembledPath = join(tempDir, `${sessionPrefix}-assembled.file`);
	await rm(assembledPath, { force: true });

	for (let index = 0;index < manifest.totalChunks;index++) {
		const chunk = storedChunks.find((item) => item.index === index);
		if (!chunk) throw new Error(`Missing chunk ${index}`);

		await appendFile(assembledPath, await readFile(chunk.path));
	}

	const assembledStats = await stat(assembledPath);
	if (assembledStats.size !== manifest.totalSize) throw new Error('Assembled file size does not match upload size');

	const assembledFile = {
		filepath: assembledPath,
		originalFilename: manifest.fileName,
		mimetype: manifest.mimeType,
		size: assembledStats.size,
	} as FormidableFile;

	const fileProvider = await client.FileManager.storageManager.getProvider(storage);
	if (!fileProvider.isOnline) throw new Error('Storage medium is offline');

	if (BigInt(manifest.totalSize) + user.totalStorageSize >= user.plan.maxStorageSize) throw new Error('File is too large');

	const latestStorage = await client.FileManager.storageManager.fetchById(storage.id);
	if (!latestStorage) throw new Error('Storage not found');
	if (BigInt(manifest.totalSize) + latestStorage.usedSize >= latestStorage.maxSize) throw new Error('Storage medium does not have enough space');

	let uploadedFile: FullFile | null = null;
	try {
		const metadataClass = new MetadataExtractor();

		let fileMimeType = manifest.mimeType;
		try {
			fileMimeType = await metadataClass.detectMimeType(assembledFile);
		} catch (err) {
			client.logger.error(err);
		}

		uploadedFile = await client.FileManager.create({
			userId: user.id,
			name: manifest.fileName,
			size: BigInt(manifest.totalSize),
			mimetype: fileMimeType,
			storageId: defaultStorageMedium.id,
			parentId: manifest.targetDirectoryId,
		});

		if (fileMimeType?.startsWith('video/')) await cleanUpVideo(client, assembledPath, `${manifest.fileName.split('.').pop()}`);
		const buffer = await readFile(assembledPath);
		await defaultProvider.writeFile(`${user.id}/${uploadedFile.id}`, buffer);

		try {
			const meta = await metadataClass.extract(assembledFile);
			if (meta != null) await client.FileManager.addMetadata(uploadedFile.id, meta);
		} catch (err) {
			client.logger.error(err);
		}

		// Send notifications when hitting storage threshold
		const max = Number(user.plan.maxStorageSize);
		if (max > 0) {
			const currentUsage = Number(user.totalStorageSize);
			const newUsage = currentUsage + manifest.totalSize;

			const thresholds = [
				{
					percent: 0.5,
					title: 'Storage Usage at 50%',
					text: 'You have used 50% of your allocated storage. No action is required, but it\'s a good time to plan ahead.',
				},
				{
					percent: 0.75,
					title: 'Storage Usage at 75%',
					text: 'You have used 75% of your allocated storage. Consider cleaning up or upgrading your plan.',
				},
				{
					percent: 0.9,
					title: 'Storage Usage at 90%',
					text: 'You are nearing full capacity. Please consider freeing up space or upgrading your plan.',
				},
				{
					percent: 1.0,
					title: 'Storage Full',
					text: 'You have reached your maximum storage capacity. You will not be able to upload new files until space is freed or your plan is upgraded.',
				},
			];

			for (const { percent, title, text } of thresholds) {
				const wasBelow = currentUsage / max < percent;
				const nowAbove = newUsage / max >= percent;

				if (wasBelow && nowAbove) {
					client.QueueManager.addToQueue('NOTIFICATIONS', () => client.notificationManager.create({ title, text, url: '/files', userId: user.id }));
					break;
				}
			}
		}

		client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
			await client.AuditLogManager.create({
				eventName: 'FILE_UPLOAD',
				resourceType: 'FILE',
				resourceId: uploadedFile?.id,
				success: true,
				userId: user.id,
				ip: getIP(req),
				userAgent: `${req.headers['user-agent']}`,
				message: 'Successfully uploaded file.',
			});
		},
		);

		await client.FileManager.storageManager.modifyUsage(storage.id, BigInt(manifest.totalSize), 'INCRE');
		await client.userManager.modifyStorageSize(user.id, BigInt(manifest.totalSize), 'SET');

		manifest.status = 'completed';
		manifest.fileId = uploadedFile.id;
		manifest.updatedAt = new Date().toISOString();

		for (const chunk of storedChunks) {
			await rm(chunk.path, { force: true });
		}

		await rm(assembledPath, { force: true });
		await writeFile(join(tempDir, `${sessionPrefix}-manifest.json`), JSON.stringify(manifest, null, 2));
		client.QueueManager.addToQueue('FILE_MIGRATION', async () => {
			try {
				const targetProvider = await client.FileManager.storageManager.getProvider(storage);
				if (!targetProvider.isOnline) throw new Error('Target storage medium is offline');

				const source = await defaultProvider.readFile(uploadedFile!);
				await targetProvider.writeFile(`${user.id}/${uploadedFile!.id}`, source);

				await client.FileManager.update({ id: uploadedFile!.id, storageId: storage.id });
				await defaultProvider.deleteFile(`${user.id}/${uploadedFile!.id}`);
			} catch (err) {
				client.logger.error(`Failed to migrate uploaded file ${uploadedFile!.id}: ${err}`);
				throw err;
			}
		});

		return {
			completed: true,
			uploadedBytes: manifest.totalSize,
			totalChunks: manifest.totalChunks,
			fileId: uploadedFile.id,
			uploadFingerprint: manifest.fingerprint,
		};
	} catch (err) {
		if (uploadedFile) {
			await client.FileManager.deleteFromDB(uploadedFile.id);
			await fileProvider.deleteFile(`${user.id}/${uploadedFile.id}`)
				.catch((deleteErr) => client.logger.error(`Failed to delete file from system: ${deleteErr}`));
		}

		throw err;
	}
};

/**
  * Get all stored chunks for a particular file (based on sessionPrefix)
  * @param tempDir The folder where the chunked files are being stored
  * @param sessionPrefix The file prefix to associate all chunks to it
  * @returns {Promise<StoredChunk[]>} List of currently stored chunks
*/
const getStoredChunks = async (tempDir: string, sessionPrefix: string): Promise<StoredChunk[]> => {
	let entries: string[];
	try {
		entries = await readdir(tempDir);
	} catch {
		return [];
	}

	const chunks: StoredChunk[] = [];
	const escapedPrefix = sessionPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(`^${escapedPrefix}-chunk-(\\d+)-([a-f0-9]{64})\\.part$`);
	for (const entry of entries) {
		const match = entry.match(pattern);
		if (!match) continue;
		const [, index, hash] = match;
		if (index === undefined || hash === undefined) continue;

		const filePath = join(tempDir, entry);
		const fileStats = await stat(filePath);
		chunks.push({ index: Number(index), hash, path: filePath, size: fileStats.size });
	}

	return chunks.sort((a, b) => a.index - b.index);
};

/**
  * When files are uploaded in folders, the folders need creating
  * @param {Client} client Global client for database queries
  * @param {FullFile} parentDir
  * @param {string} userId
  * @param {string} folderPath
  * @param {string} storageId
  * @returns {Promise<FullFile>} The last folder needed to link the file
*/
async function ensureFolderExists(client: Client, parentDir: FullFile, userId: string, folderPath: string, storageId: string): Promise<FullFile> {
	const pathParts = folderPath.split('/').filter(Boolean);

	let dir = parentDir;
	for (const part of pathParts) {
		const existing = dir.children.find((child) => child.type === 'DIRECTORY' && child.name === part);
		const next = existing ? await client.FileManager.fetchById(existing.id)
			: await client.FileManager.create({
				userId,
				name: part,
				size: BigInt(client.config.get('FOLDER_SIZE')),
				type: 'DIRECTORY',
				mimetype: null,
				storageId,
				parentId: dir.id,
			});

		if (!next) throw new Error('Missing parent directory');
		dir = next;
	}

	return dir;
}

/**
  * Hash the file
  * @param filePath Where the file is stored
  * @returns {Promise<string>}
*/
const hashFile = async (filePath: string): Promise<string> => {
	const hash = createHash('sha256');
	const stream: AsyncIterable<Buffer> = createReadStream(filePath);

	for await (const chunk of stream) hash.update(chunk);
	return hash.digest('hex');
};

/**
  * Get the full path of the chunked file
  * @param {string} tempDir The folder where the chunked files are being stored
  * @param {string} sessionPrefix Chunk metadata part
  * @param {number} index Index of the chunked in context of all chunks for a file
  * @param {string} hash Chunk metadata part
  * @returns {string} Get the full file path of the chunked file
*/
const getChunkPath = (tempDir: string, sessionPrefix: string, index: number, hash: string): string => {
	return join(tempDir, `${sessionPrefix}-chunk-${index}-${hash}.part`);
};