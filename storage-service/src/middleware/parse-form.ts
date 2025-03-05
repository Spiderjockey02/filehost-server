import { join } from 'path';
import formidable from 'formidable';
import { mkdir } from 'fs/promises';
import fs from 'fs';
import type { Request } from 'express';
import { CONSTANTS, PATHS } from '../utils';
import type { FullUser } from '../types/database/User';
import { Client } from 'src/helpers';
import type { File } from '@prisma/client';

export default async (client: Client, req: Request, userId: string): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
	// eslint-disable-next-line no-async-promise-executor
	return await new Promise(async (resolve, reject) => {

		// Get the path from the referer
		const refererPath = req.headers['referer']?.split('/files')[1] || '';
		const path = (refererPath.length > 0) ? decodeURI(refererPath) : '/';

		// Check if the path is valid
		const uploadDir = join(PATHS.CONTENT, userId, path);
		if (!client.FileManager._verifyTraversal(userId, uploadDir)) throw 'Invalid path';

		let user: FullUser | null;
		try {
			user = await client.userManager.fetchbyParam({ id: userId });
			if (!user) throw 'Missing user';

			// Make sure they haven't already uploaded max storage
			if (user.totalStorageSize >= Number(user.group?.maxStorageSize ?? 0)) throw 'Max storage reached';

			// Just make sure the folder exists
			await mkdir(uploadDir, { recursive: true });
		} catch (e) {
			console.log('error', e);
			return reject(e);
		}

		const form = formidable({
			allowEmptyFiles: false,
			maxFileSize: CONSTANTS.MAX_FILE_SIZE,
			uploadDir,
			// Make sure the uploaded file's mime type is allowed
			filter: ({ mimetype }) => {
				if (!mimetype) return false;
				return !CONSTANTS.DISALLOWED_MIME_TYPES.some((blocked) => {
					// First check if it's a wildcard block
					if (blocked.endsWith('/*')) return mimetype.startsWith(blocked.slice(0, -2));
					return mimetype === blocked;
				});
			},
			// Rename the file if it already exists
			filename: (_name, _ext, part) => {
				const baseName = part.originalFilename?.replace(/\.[^/.]+$/, '') || 'file';
				const extension = part.originalFilename?.split('.').pop() || '';
				let finalName = `${baseName}.${extension}`;

				// Check if a folder of files is being uploaded
				if (finalName.includes('/')) mkdir(`${uploadDir}/${finalName.split('/').slice(0, -1).join('/')}`, { recursive: true });

				let counter = 1;
				const MAX_ATTEMPTS = 10;
				while (counter <= MAX_ATTEMPTS) {
					const fullPath = join(uploadDir, finalName);
					if (fs.existsSync(fullPath)) {
						const newBaseName = `${baseName} (${counter})`;
						finalName = `${newBaseName}.${extension}`;
						counter++;
					} else {
						break;
					}
				}
				if (counter > MAX_ATTEMPTS) throw new Error('Too many duplicate file names');
				return finalName;
			},
		});

		form.parse(req, async function(err, fields, files) {
			if (err) return reject(err);

			try {
				// Update user's total storage size
				const size: number = files.media?.reduce((a, b) => a + b.size, 0) ?? 0;
				await client.userManager.update({ id: userId, totalStorageSize: (user?.totalStorageSize ?? 0n) + BigInt(size) });
				for (const file of files.media ?? []) {
					const filePath = file.newFilename;
					const lastSlashIndex = filePath.lastIndexOf('/');

					// Check if a folder was uploaded or not (etc/text.txt vs text.tst)
					if (lastSlashIndex > -1) {
						const folderPath = `/${filePath.substring(0, lastSlashIndex)}`;
						const fileName = filePath.substring(lastSlashIndex + 1);
						await ensureFolderExists(client, userId, folderPath);

						// Add the file to the folder
						const dir = await client.FileManager.getByFilePath(userId, folderPath);
						if (!dir) return reject('Missing parent directory');

						await client.FileManager.update({
							id: dir.id,
							children: {
								userId,
								name: fileName,
								path: `${folderPath}/${fileName}`,
								size: BigInt(file.size),
							},
						});
					} else {
						// File is uploaded to the root directory
						const dir = await client.FileManager.getByFilePath(userId, path);
						if (!dir) return reject('Missing parent directory');

						await client.FileManager.update({
							id: dir.id,
							children: {
								userId,
								name: filePath,
								path: `${path}${filePath}`,
								size: BigInt(file.size),
							},
						});
					}
				}

				resolve({ fields, files });
			} catch (error) {
				console.log(error);
				reject(error);
			}
		});
	});
};

// Helper function to create folders recursively
async function ensureFolderExists(client: Client, userId: string, fullPath: string) {
	const pathParts = fullPath.split('/');
	let parentDir = (await client.FileManager.getByFilePath(userId, '/') as File);
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
					size: 0n,
					type: 'DIRECTORY',
				},
			});
		}

		parentDir = dir;
	}
}