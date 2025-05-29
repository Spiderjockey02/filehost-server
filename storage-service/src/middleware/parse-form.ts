import type { UserWithGroup } from 'src/types/database/User';
import { cleanUpVideo } from '../utils/VideoPreprocessor';
import { CONSTANTS, normalizePath } from '../utils';
import type Client from '../helpers/Client';
import type { File } from '@prisma/client';
import type { Request } from 'express';
import formidable from 'formidable';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export default async (client: Client, req: Request, user: UserWithGroup) => {
	// Make sure they haven't already uploaded past their max storage
	if (user.totalStorageSize >= (user.group?.maxStorageSize ?? 0)) throw 'Max storage reached';

	// Get storage and it's provider
	const storage = await client.FileManager.storageManager.fetchById(user.storageId);
	if (storage == null) throw 'Storage not found';
	const fileProvider = client.FileManager.storageManager.getProvider(storage);

	const form = formidable({
		allowEmptyFiles: false,
		maxFileSize: CONSTANTS.MAX_FILE_SIZE,
		// Make sure the uploaded file's mime type is allowed
		filter: ({ mimetype }) => {
			if (!mimetype) return false;
			return !CONSTANTS.DISALLOWED_MIME_TYPES.some((blocked) => {
				// First check if it's a wildcard block
				if (blocked.endsWith('/*')) return mimetype.startsWith(blocked.slice(0, -2));
				return mimetype === blocked;
			});
		},
	});

	// Parse the form data & get the metadata
	const [fields, files] = await form.parse(req);
	if (fields.metadata == undefined) throw 'No metadata provided';
	const metadata = JSON.parse(fields.metadata[0]);
	if (metadata.parentId == undefined) throw 'No parentId provided';

	for (const file of files.media ?? []) {

		let uploadedFile = null;
		try {
			let dir = await client.FileManager.getById(metadata.parentId);
			if (!dir) throw 'Missing parent directory';

			// Ensure the file would not bring the user over their max storage
			if ((BigInt(file.size) + user.totalStorageSize) >= (user.group?.maxStorageSize ?? 0n)) throw 'File is too large';

			// Check the file isn't already in the directory (Upload CONFLICT)
			const existingFile = await client.FileManager.getByFilePath(user.id, `${dir.path}${file.originalFilename}`);
			if (existingFile) throw 'File with that name already exists';

			// Update user's storage size
			await client.userManager.modifyStorageSize(user.id, BigInt(file.size), 'INCRE');

			// Check if a folder was uploaded
			const lastSlashIndex = `${file.originalFilename}`.lastIndexOf('/');
			if (lastSlashIndex > -1) {
				const folderPath = `/${`${file.originalFilename}`.substring(0, lastSlashIndex)}`;
				const fileName = `${file.originalFilename}`.substring(lastSlashIndex + 1);
				await ensureFolderExists(client, user.id, folderPath, storage.id);

				// Add the file to the folder
				dir = await client.FileManager.getByFilePath(user.id, folderPath);
				if (!dir) throw 'Missing parent directory';

				await client.FileManager.update({
					id: dir.id,
					children: {
						userId: user.id,
						name: fileName,
						path: `${folderPath}/${fileName}`,
						size: BigInt(file.size),
						mimetype: file.mimetype,
						storageId: storage.id,
					},
				});
			} else {
				dir = await client.FileManager.getByFilePath(user.id, dir.path);
				if (!dir) {
					dir = await client.FileManager.create({
						userId: user.id,
						path: '/',
						size: 0n,
						type: 'DIRECTORY',
						name: '/',
						mimetype: null,
						storageId:  storage.id,
					});
				}

				uploadedFile = await client.FileManager.update({
					id: dir.id,
					children: {
						userId: user.id,
						name: `${file.originalFilename}`,
						path: `${normalizePath(dir.path)}${file.originalFilename}`,
						size: BigInt(file.size),
						mimetype: file.mimetype,
						storageId: storage.id,
					},
				});
			}

			// Check if the uploaded file is a video
			if (file.mimetype?.startsWith('video/')) await cleanUpVideo(file.filepath, `${file.originalFilename?.split('.').pop()}`);

			// Move the uploaded file away from temp folder to storage server
			const buffer = await readFile(file.filepath);
			await fileProvider.writeFileToSystem(`${path.join(user.id, dir.path, `${file.originalFilename}`)}`, buffer);
		} catch (error) {
			// Delete the files that were uploaded
			await fileProvider.deleteFileOnSystem(file.filepath);
			const uploadedId = uploadedFile?.children.find(c => c.name == file.originalFilename);
			if (uploadedId) client.FileManager.deleteFromDB(uploadedId.id);

			throw error;
		}
	}
	return { fields, files };
};

// Helper function to create folders recursively
async function ensureFolderExists(client: Client, userId: string, fullPath: string, storageId: string) {
	const pathParts = fullPath.split('/');
	let parentDir = await client.FileManager.getByFilePath(userId, '/') as File;
	let currentPath = parentDir.path;

	for (const part of pathParts) {
		currentPath = `${parentDir.path.endsWith('/') ? parentDir.path : `${parentDir.path}/`}${part}`;

		// Check if the directory already exists
		let dir = await client.FileManager.getByFilePath(userId, currentPath);
		if (!dir) {
			// If it doesn't exist, create it
			dir = await client.FileManager.update({
				id: parentDir.id,
				children: {
					userId,
					name: part,
					path: currentPath,
					size: 4096n,
					type: 'DIRECTORY',
					mimetype: null,
					storageId: storageId,
				},
			});
		}

		parentDir = dir;
	}
}