import type { UserWithPlan } from '@/types/database/User';
import MetadataExtractor from '@/media/MetadataExtractor';
import { cleanUpVideo } from '@/media/VideoPreprocessor';
import type { FullFile } from '@/types/database/File';
import type { File } from '@/types/generated/client';
import { getIP, normalizePath } from '@/utils';
import { readFile } from 'node:fs/promises';
import type Client from '@/helpers/Client';
import type { Request } from 'express';
import formidable from 'formidable';

export default async (client: Client, req: Request, user: UserWithPlan) => {
	// Make sure they haven't already uploaded past their max storage
	if (user.totalStorageSize >= user.plan.maxStorageSize) throw new Error('Max storage reached');

	// Get storage and it's provider
	const storage = await client.FileManager.storageManager.fetchById(user.storageId);
	if (storage == null) throw new Error('Storage not found');
	const fileProvider = await client.FileManager.storageManager.getProvider(storage);
	if (fileProvider.isOnline == false) throw new Error('Storage medium is offline');

	const form = formidable({
		allowEmptyFiles: false,
		maxFileSize: Number(user.plan.maxFileSize),
		// Make sure the uploaded file's mime type is allowed
		filter: ({ mimetype }) => {
			if (!mimetype) return false;
			return !client.config.get('DISALLOWED_MIME_TYPES').some((blocked) => {
				// First check if it's a wildcard block
				if (blocked.endsWith('/*')) return mimetype.startsWith(blocked.slice(0, -2));
				return mimetype === blocked;
			});
		},
	});

	// Parse the form data & get the metadata
	const [fields, files] = await form.parse(req);
	if (fields['metadata'] == undefined) throw new Error('No metadata provided');
	const metadata = JSON.parse(fields['metadata'][0] ?? '');
	if (metadata.parentId == undefined) throw new Error('No parentId provided');

	for (const file of files['media'] ?? []) {
		let uploadedFile: FullFile | null = null;
		try {
			let dir = await client.FileManager.fetchById(metadata.parentId);
			if (!dir) throw new Error('Missing parent directory');

			// Ensure the file would not bring the user over their max storage
			if ((BigInt(file.size) + user.totalStorageSize) >= user.plan.maxStorageSize) throw new Error('File is too large');

			// Make sure the storage medium has enough space aswell
			if ((BigInt(file.size) + storage.usedSize) >= storage.maxSize) throw new Error('Storage medium does not have enough space');

			// Check the file isn't already in the directory (Upload CONFLICT)
			const existingFile = await client.FileManager.fetchByFilePath(user.id, `${dir.path}${file.originalFilename}`);
			if (existingFile) throw new Error('File with that name already exists');

			// Update user's storage size
			await client.userManager.modifyStorageSize(user.id, BigInt(file.size), 'INCRE');
			await client.FileManager.storageManager.modifyUsage(storage.id, BigInt(file.size), 'INCRE');

			// Verify mime-type ('application/octet-stream' is the default mime-type, so try and analyse it for correct mime-type)
			const metadataClass = new MetadataExtractor();
			let fileMimeType = file.mimetype;
			try {
				fileMimeType = await metadataClass.detectMimeType(file);
			} catch (err) {
				client.logger.error(err);
			}

			// Check if a folder was uploaded
			const lastSlashIndex = `${file.originalFilename}`.lastIndexOf('/');
			if (lastSlashIndex > -1) {
				const folderPath = `${file.originalFilename?.substring(0, lastSlashIndex)}`;
				const fileName = `${file.originalFilename}`.substring(lastSlashIndex + 1);

				// Add the file to the folder
				dir = await ensureFolderExists(client, dir, user.id, folderPath, storage.id);
				if (!dir) throw new Error('Missing parent directory');

				uploadedFile = await client.FileManager.create({
					userId: user.id,
					name: fileName,
					path: `${dir.path}/${fileName}`,
					size: BigInt(file.size),
					mimetype: fileMimeType,
					storageId: storage.id,
					parentId: dir.id,
				});
			} else {
				dir = await client.FileManager.fetchByFilePath(user.id, dir.path);
				if (!dir) {
					dir = await client.FileManager.create({
						userId: user.id,
						path: '/',
						size: BigInt(client.config.get('FOLDER_SIZE')),
						type: 'DIRECTORY',
						name: '/',
						mimetype: null,
						storageId:  storage.id,
					});
				}

				uploadedFile = await client.FileManager.create({
					userId: user.id,
					name: `${file.originalFilename}`,
					path: `${normalizePath(dir.path)}${file.originalFilename}`,
					size: BigInt(file.size),
					mimetype: fileMimeType,
					storageId: storage.id,
					parentId: dir.id,
				});
			}

			// Check if the uploaded file is a video
			if (fileMimeType?.startsWith('video/')) await cleanUpVideo(client, file.filepath, `${file.originalFilename?.split('.').pop()}`);

			// Move the uploaded file away from temp folder to storage server
			const buffer = await readFile(file.filepath);
			await fileProvider.writeFile(`${user.id}/${uploadedFile.id}`, buffer);

			// Extract metadata
			try {
				const meta = await metadataClass.extract(file);
				if (meta != null) await client.FileManager.addMetadata(uploadedFile.id, { ...meta });
			} catch (err) {
				client.logger.error(err);
			}

			// Notification
			const max = Number(user.plan.maxStorageSize);
			if (max > 0) {
				const currentUsage = Number(user.totalStorageSize);
				const newUsage = currentUsage + file.size;

				const thresholds = [
					{ percent: 0.5, title: 'Storage Usage at 50%', text: 'You have used 50% of your allocated storage. No action is required, but it\'s a good time to plan ahead.' },
					{ percent: 0.75, title: 'Storage Usage at 75%', text: 'You have used 75% of your allocated storage. Consider cleaning up or upgrading your storage plan.' },
					{ percent: 0.9, title: 'Storage Usage at 90%', text: 'You are nearing full capacity. Please consider freeing up space or upgrading your plan.' },
					{ percent: 1.0, title: 'Storage Full', text: 'You have reached your maximum storage capacity. You will not be able to upload new files until space is freed or your plan is upgraded.' },
				];

				for (const { percent, title, text } of thresholds) {
					const wasBelow = currentUsage / max < percent;
					const nowAbove = newUsage / max >= percent;

					if (wasBelow && nowAbove) {
						client.QueueManager.addToQueue('NOTIFICATIONS', () =>
							client.notificationManager.create({
								title,
								text,
								url: '/files',
								userId: user.id,
							}),
						);
						break;
					}
				}
			}

			// Audit logs
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
			});

			user.totalStorageSize += BigInt(file.size);
		} catch (err) {
			// Delete the file from the storage system and/or database if it was created
			if (uploadedFile) {
				await client.FileManager.deleteFromDB(uploadedFile.id);
				await fileProvider.deleteFile(`${user.id}/${uploadedFile.id}`).catch((err) => {
					client.logger.error(`Failed to delete file from system: ${err}`);
				});
			}

			// Audit logs
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					eventName: 'FILE_UPLOAD',
					resourceType: 'FILE',
					resourceId: uploadedFile?.id,
					success: false,
					userId: user.id,
					ip: getIP(req),
					userAgent: `${req.headers['user-agent']}`,
					message: `Failed to upload file due to error: ${err}.`,
				});
			});

			throw err;
		}
	}

	return { fields, files };
};

// Helper function to create folders recursively
async function ensureFolderExists(client: Client, parentDir: File, userId: string, fullPath: string, storageId: string) {
	const pathParts = fullPath.split('/');
	let currentPath = parentDir.path;
	let dir = null;

	for (const part of pathParts) {
		currentPath = `${currentPath.endsWith('/') ? currentPath : `${currentPath}/`}${part}`;
		// Check if the directory already exists
		dir = await client.FileManager.fetchByFilePath(userId, currentPath);
		if (!dir) {
			// If it doesn't exist, create it
			dir = await client.FileManager.create({
				userId,
				name: part,
				path: currentPath,
				size: 4096n,
				type: 'DIRECTORY',
				mimetype: null,
				storageId: storageId,
				parentId: parentDir.id,
			});
		}
		parentDir = dir;
	}

	return dir;
}