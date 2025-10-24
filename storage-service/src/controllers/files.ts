import { getSession, parseForm } from '../middleware';
import { Error, getIP, sanitiseObject } from '../utils';
import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import { FileType } from '@prisma/client';

// Endpoint GET /api/files
export const getFiles = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// Fetch from cache
			const filePath = (req.params.path as unknown as string[]).join('/');
			const file = await client.FileManager.getDirectory(session.user, filePath);

			res.json({ file });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch file.');
		}
	};
};

// Endpoint POST /api/files/upload
export const postFileUpload = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// User can't edit their files if they are migrating storages
			if (session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before uploading files.');

			// Parse and save file(s)
			const { files } = await parseForm(client, req, session.user);
			if (Object.keys(files).length == 0) throw 'No files uploaded';

			res.json({ success: 'File(s) successfully uploaded.' });
		} catch (err) {
			client.logger.error(err);
			if (typeof err == 'string') return Error.IncorrectQuery(res, err);
			Error.GenericError(res, 'Failed to upload file.');
		}
	};
};

// Endpoint DELETE /api/files/delete
export const deleteFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		const { fileId } = req.body;

		try {
			// User can't edit their files if they are migrating storages
			if (session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before deleting files.');

			// Validate request body
			if (typeof fileId !== 'string' || fileId.length == 0) return Error.IncorrectQuery(res, 'File ID is missing from request');

			await client.FileManager.delete(session.user, fileId);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_TRASHED',
					message: 'File moved to trash',
					resourceId: fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully deleted item.' });
		} catch (err) {
			client.logger.error(err);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_TRASHED',
					message: 'File failed to moved to trash',
					resourceId: fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			if (typeof err == 'string') return Error.IncorrectQuery(res, err);
			Error.GenericError(res, 'Failed to delete item.');
		}
	};
};

// Endpoint DELETE /api/files/bulk-delete
export const deleteBulkFiles = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		// User can't edit their files if they are migrating storages
		if (session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before deleting files.');

		// Validate request body
		const { paths } = req.body;
		if (!Array.isArray(paths) || paths.length == 0) return Error.IncorrectQuery(res, 'File paths are missing from request');

		// Loop through and delete all files
		let successfullyDeletion = 0;
		for (const filePath of paths) {
			try {
				// Delete file but also delete the access so no broken links in the recently viewed files
				const file = await client.FileManager.delete(session.user, filePath);
				await client.recentlyViewedFileManager.delete(file.userId, file.id);
				successfullyDeletion++;
			} catch (err) {
				client.logger.error(err);
			}
		}

		if (successfullyDeletion == 0) return Error.GenericError(res, 'Failed to delete any files.');
		res.json({ success: `Successfully deleted ${successfullyDeletion}/${paths.length} items.` });
	};
};

// Endpoint POST /api/files/move
export const postMoveFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		// User can't edit their files if they are migrating storages
		if (session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before moving files.');

		// Validate request body
		const { newDirId, fileId } = req.body;
		if (typeof newDirId !== 'string' || newDirId.length == 0) return Error.IncorrectQuery(res, 'New directory ID is missing from request');
		if (typeof fileId !== 'string' || fileId.length == 0) return Error.IncorrectQuery(res, 'File ID is missing from request');

		try {
			await client.FileManager.move(session.user, fileId, newDirId);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_MOVE',
					message: `File moved to directory ${newDirId}`,
					resourceId: fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully moved item' });
		} catch (err) {
			client.logger.error(err);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_MOVE',
					message: `File moved to directory ${newDirId}`,
					resourceId: fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			if (typeof err == 'string') return Error.IncorrectQuery(res, err);
			Error.GenericError(res, 'Failed to move item.');
		}
	};
};

// Endpoint POST /api/files/copy
export const postCopyFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		const { newDirId, fileId } = req.body;

		try {
			// User can't edit their files if they are migrating storages
			if (session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before copying files.');

			// Validate request body
			if (typeof newDirId !== 'string' || newDirId.length == 0) return Error.IncorrectQuery(res, 'New directory ID is missing from request');
			if (typeof fileId !== 'string' || fileId.length == 0) return Error.IncorrectQuery(res, 'File ID is missing from request');

			await client.FileManager.copy(session.user, fileId, newDirId);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_COPY',
					message: `File copied to directory ${newDirId}`,
					resourceId: fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully copied file' });
		} catch (err) {
			client.logger.error(err);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_COPY',
					message: `File failed to be copied to directory ${newDirId}`,
					resourceId: fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
				if (typeof err == 'string') return Error.IncorrectQuery(res, err);
				Error.GenericError(res, 'Failed to copy item.');
			});
		}
	};
};

// Endpoint POST /api/files/download
export const postDownloadFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		const { id } = req.body;

		try {
			// Validate the file ID
			if (typeof id !== 'string' || id.length == 0) return Error.IncorrectQuery(res, 'File ID is missing from request');

			// Fetch file from database
			const file = await client.FileManager.getById(id);
			if (!file) return Error.MissingResource(res, 'File not found');
			if (file.userId !== session.user.id) return Error.MissingResource(res, 'File not found');

			const fullFile = await client.FileManager.getByFilePath(session.user.id, file.path);
			await client.FileManager.downloadFile(res, session.user, fullFile!);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_DOWNLOAD',
					message: 'File failed to moved to trash',
					resourceId: file.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
		} catch (error) {
			client.logger.error(error);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_DOWNLOAD',
					message: 'File failed to moved to trash',
					resourceId: id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			Error.GenericError(res, 'Failed to download file.');
		}
	};
};

// Endpoint GET /api/files/bulk-download
export const getBulkDownload = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// Validate request body
			const { paths } = req.body;
			if (!Array.isArray(paths) || paths.length == 0) return Error.IncorrectQuery(res, 'File paths are missing from request');
			const filePaths: string[] = paths;

			const files = await Promise.all(filePaths.map(async (f) => await client.FileManager.getByFilePath(session?.user.id, f)));
			client.FileManager.downloadFiles(res, session.user, files.filter(s => s !== null));
		} catch (error) {
			client.logger.error(error);
			Error.GenericError(res, 'Failed to download files.');
		}
	};
};


// Endpoint POST /api/files/rename
export const postRenameFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		const { fileId, newName } = req.body;

		if (typeof fileId !== 'string' || fileId.length == 0) return Error.IncorrectQuery(res, 'fileId is missing from request');
		if (typeof newName !== 'string' || newName.replace(/\.[^/.]+$/, '').length == 0) return Error.IncorrectQuery(res, 'newName is missing from request');

		try {
			// User can't edit their files if they are migrating storages
			if (session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before renaming files.');

			// Rename file
			await client.FileManager.rename(session.user, fileId, newName);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_RENAME',
					message: `File renamed to ${newName}`,
					resourceId: fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully renamed item' });
		} catch (err) {
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_RENAME',
					message: `File failed to rename to ${newName}`,
					resourceId: fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			client.logger.error(err);
			if (typeof err == 'string') return Error.IncorrectQuery(res, err);
			Error.GenericError(res, 'Failed to rename item.');
		}
	};
};

// Endpoint POST /api/files/create-folder
export const postCreateFolder = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		const { parentId, folderName } = req.body;

		try {
			// User can't edit their files if they are migrating storages
			if (session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before creating a folder.');

			if (typeof folderName !== 'string' || folderName.trim().length == 0) return Error.IncorrectQuery(res, 'Folder name is not a string.');

			// Decode & santise the referer path to ensure the folder is added to the correct path
			await client.FileManager.createDirectory(session.user, parentId, folderName.trim());
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FOLDER_CREATE',
					message: 'Folder created',
					resourceId: parentId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully created folder.' });
		} catch (err) {
			client.logger.error(err);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FOLDER_CREATE',
					message: 'Folder failed to create',
					resourceId: parentId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			if (typeof err == 'string') return Error.IncorrectQuery(res, err);
			Error.GenericError(res, 'Failed to create folder.');
		}
	};
};

// Endpoint GET /api/files/search
export const getSearchFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// Search for file with extra information if sent aswell
			const srch = req.query.query;
			if (typeof srch !== 'string' || srch.length == 0) return Error.IncorrectQuery(res, 'Query is missing from request');

			const fileType = req.query.fileType;
			const type = [undefined, FileType.FILE, FileType.DIRECTORY][Number(fileType)] ?? undefined;
			const files = await client.FileManager.searchByName(session.user.id, srch, type);

			// Only need to send the name and path for search query
			res.json({ query: sanitiseObject(files) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to search for item.');
		}
	};
};

// Endpoint GET /api/files/directories
export const getAllDirectories = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			const dirs = await client.FileManager.fetchOwnedByUserId({ userId: session.user.id, type: 'DIRECTORY' });
			res.json({ dirs: sanitiseObject(dirs) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get all user\'s directories.');
		}
	};
};