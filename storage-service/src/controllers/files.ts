import { validateCreateFolder, validateFileId, validateFileIds, validateFileRenames, validateMoveFile, validateRenameFile, validateSearchQuery } from '@/validators/files';
import { authenticatedHandler, parseForm } from '@/middleware';
import { Error, getIP, sanitiseObject } from '@/utils';
import type { AuthenticatedRequest } from '@/types';
import type Client from '@/helpers/Client';
import type { Response } from 'express';

// Endpoint GET /api/files{/:fileId}
export const getFiles = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {

			const fileId = typeof req.params['fileId'] === 'string' ? req.params['fileId'] : '';
			const [file, path] = await Promise.all([
				client.FileManager.getDirectory(req.session['user'], fileId),
				client.FileManager.fetchFilePath(fileId),
			]);
			res.json({ file, path: sanitiseObject(path.map(p => ({ ...p, depth: Number(p.depth) }))) });
		} catch (err) {
			client.logger.error(err);
			if (err == 'Directory not found') return Error.MissingResource(res);
			Error.GenericError(res, 'Failed to fetch file.');
		}
	});
};

// Endpoint POST /api/files/upload
export const postFileUpload = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			// User can't edit their files if they are migrating storages
			if (req.session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before uploading files.');

			// Parse and save file(s)
			await parseForm(client, req);
			res.json({ success: 'File(s) successfully uploaded.' });
		} catch (err) {
			client.logger.error(err);
			if (typeof err == 'string') return Error.IncorrectQuery(res, [{ message: err }]);
			Error.GenericError(res, 'Failed to upload file.');
		}
	});
};

// Endpoint DELETE /api/files/delete
export const deleteFile = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {

		const result = validateFileId.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			// User can't edit their files if they are migrating storages
			if (req.session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before deleting files.');

			await client.FileManager.delete(req.session.user, result.data.fileId);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_TRASHED',
					message: 'File successfully moved to trash.',
					resourceId: result.data.fileId,
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
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_TRASHED',
					message: `File failed to move to trash due to error: ${err}.`,
					resourceId: result.data.fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			Error.GenericError(res, 'Failed to delete item.');
		}
	});
};

// Endpoint DELETE /api/files/bulk-delete
export const deleteBulkFiles = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {

		// User can't edit their files if they are migrating storages
		if (req.session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before deleting files.');

		// Validate request body
		const result = validateFileIds.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		// Loop through and delete all files
		let successfullyDeletion = 0;
		for (const fileId of result.data.fileIds) {
			try {
				// Delete file but also delete the access so no broken links in the recently viewed files
				const file = await client.FileManager.delete(req.session.user, fileId);
				await client.recentlyViewedFileManager.delete(file.userId, file.id);
				successfullyDeletion++;
			} catch (err) {
				client.logger.error(err);
			}
		}

		if (successfullyDeletion == 0) return Error.GenericError(res, 'Failed to delete any files.');
		res.json({ success: `Successfully deleted ${successfullyDeletion}/${result.data.fileIds.length} items.` });
	});
};

// Endpoint POST /api/files/move
export const postMoveFile = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {

		// User can't edit their files if they are migrating storages
		if (req.session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before moving files.');

		// Validate request body
		const result = validateMoveFile.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			await client.FileManager.move(req.session.user, result.data.fileId, result.data.newDirId);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_MOVE',
					message: `File successfully moved to directory ${result.data.newDirId}.`,
					resourceId: result.data.fileId,
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
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_MOVE',
					message: `File failed to move to directory ${result.data.newDirId} due to error: ${err}.`,
					resourceId: result.data.fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			Error.GenericError(res, 'Failed to move item.');
		}
	});
};

// Endpoint POST /api/files/copy
export const postCopyFile = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {

		// Validate request body
		const result = validateMoveFile.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			// User can't edit their files if they are migrating storages
			if (req.session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before copying files.');

			await client.FileManager.copy(req.session.user, result.data.fileId, result.data.newDirId);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_COPY',
					message: `File successfully copied to directory ${result.data.newDirId}.`,
					resourceId: result.data.fileId,
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
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_COPY',
					message: `File failed to be copied to directory ${result.data.newDirId} due to error: ${err}.`,
					resourceId: result.data.fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});

				return Error.GenericError(res, 'Failed to copy item.');
			});
		}
	});
};

// Endpoint POST /api/files/download
export const postDownloadFile = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {

		// Validate request body
		const result = validateFileId.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			// Fetch file from database and verify ownership
			const file = await client.FileManager.fetchById(result.data.fileId);
			if (!file) return Error.MissingResource(res);
			if (file.userId !== req.session.user.id) return Error.MissingResource(res);

			await client.FileManager.downloadFile(res, file);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_DOWNLOAD',
					message: 'File successfully downloaded.',
					resourceId: file.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
		} catch (err) {
			client.logger.error(err);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_DOWNLOAD',
					message: `File failed to download due to error: ${err}.`,
					resourceId: result.data.fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			Error.GenericError(res, 'Failed to download file.');
		}
	});
};

// Endpoint GET /api/files/bulk-download
export const getBulkDownload = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {

			// Validate request body
			const result = validateFileIds.safeParse(req.body);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			// Fetch files
			const fileIds = result.data.fileIds;
			const files = await Promise.all(fileIds.map((f) => client.FileManager.fetchById(f)));
			const notNullFiles = files.filter(s => s !== null);

			// Check ownership of requested files
			const isValidOwner = notNullFiles.every(f => f.userId == req.session.userId);
			if (!isValidOwner) return Error.InvalidAccess(res);

			await client.FileManager.downloadFiles(res, notNullFiles);
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to download files.');
		}
	});
};


// Endpoint POST /api/files/rename
export const postRenameFile = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {

		// Validate request body
		const result = validateRenameFile.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			// User can't edit their files if they are migrating storages
			if (req.session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before renaming files.');

			// Rename file
			await client.FileManager.rename(req.session.user, result.data.fileId, result.data.newName);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_RENAME',
					message: `File renamed to ${result.data.newName}.`,
					resourceId: result.data.fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully renamed item' });
		} catch (err) {
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_RENAME',
					message: `File failed to rename to ${result.data.newName} due to error: ${err}.`,
					resourceId: result.data.fileId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			client.logger.error(err);
			Error.GenericError(res, 'Failed to rename item.');
		}
	});
};

// Endpoint POST /api/files/bulk-rename
export const postBulkRename = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {

		try {
			// Validate request body
			const result = validateFileRenames.safeParse(req.body);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			await client.FileManager.renameBulk(req.session.user, result.data);
			res.json({ success: 'Successfully updated all files' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to update file names.');
		}
		return;
	});
};

// Endpoint POST /api/files/create-folder
export const postCreateFolder = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {

		const result = validateCreateFolder.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			// User can't edit their files if they are migrating storages
			if (req.session.user.isMigrating) return Error.GenericError(res, 'Please wait for migration to finish before creating a folder.');

			// Decode & santise the referer path to ensure the folder is added to the correct path
			await client.FileManager.createDirectory(req.session.user, result.data.parentId, result.data.folderName.trim());
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FOLDER_CREATE',
					message: 'Successfully created folder.',
					resourceId: result.data.parentId,
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
					userId: req.session.user.id,
					resourceType: 'FILE',
					eventName: 'FOLDER_CREATE',
					message: `Failed to create folder due to error: ${err}.`,
					resourceId: result.data.parentId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			Error.GenericError(res, 'Failed to create folder.');
		}
	});
};

// Endpoint GET /api/files/search
export const getSearchFile = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {

			const result = validateSearchQuery.safeParse(req.query);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);
			const { query, fileType, page } = result.data;

			// Only need to send the name and path for search query
			const [files, total] = await Promise.all([
				client.FileManager.searchByName({ userId: req.session.user.id, query, type: fileType, page }),
				client.FileManager.searchByNameCount({ userId: req.session.user.id, query, type: fileType }),
			]);

			res.json({ files: sanitiseObject(files), total });

			// If page is present log the query
			const settings = await client.userManager.fetchConfig(req.session.userId);
			if (page !== undefined && settings?.isSearchHistoryEnabled) client.userActivityManager.createSearchHistory({ userId: req.session.userId, ...result.data });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to search for item.');
		}
		return;
	});
};

// Endpoint GET /api/files/directories
export const getAllDirectories = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {

			const dirs = await client.FileManager.fetchOwnedByUserId({ userId: req.session.user.id, type: 'DIRECTORY' });
			res.json({ dirs: sanitiseObject(dirs) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get all user\'s directories.');
		}
	});
};