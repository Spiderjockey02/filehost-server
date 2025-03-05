import { Request, Response } from 'express';
import { CONSTANTS, Error, sanitiseObject } from '../utils';
import { getSession, parseForm } from '../middleware';
import { Client } from '../helpers';
import path from 'node:path';
import { FileType } from '@prisma/client';

// Endpoint GET /api/files
export const getFiles = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			// Fetch from cache
			const filePath = req.params.path;
			const file = await client.FileManager.getDirectory(session.user.id, filePath || '/');

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
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			// Parse and save file(s)
			const { files } = await parseForm(client, req, session.user.id);
			const file = files.media;
			if (file == undefined) throw 'No files uploaded';

			return res.json({ success: 'File(s) successfully uploaded.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to upload file.');
		}
	};
};

// Endpoint DELETE /api/files/delete
export const deleteFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			const { fileName } = req.body;
			const userPath = (req.headers.referer)?.split('/files')[1] ?? '';

			await client.FileManager.delete(session.user.id, `${userPath}/${fileName}`);
			res.json({ success: 'Successfully deleted item.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete item.');
		}
	};
};

// Endpoint DELETE /api/files/bulk-delete
export const deleteBulkFiles = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);
			const { paths } = req.body;
			const filePaths: string[] = paths;

			// Loop through and delete all files
			for (const filePath of filePaths) {
				// Delete file but also delete the access so no broken links in the recently viewed files
				const file = await client.FileManager.delete(session.user.id, filePath);
				await client.recentlyViewedFileManager.delete(file.userId, file.id);
			}

			res.json({ success: 'Successfully deleted items.' });
		} catch (error) {
			client.logger.error(error);
			Error.GenericError(res, 'Failed to delete items.');
		}
	};
};

// Endpoint POST /api/files/move
export const postMoveFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);
			const { newPath, fileName } = req.body;
			const oldPath = (req.headers.referer)?.split('/files')[1] ?? '/';

			await client.FileManager.move(session.user.id, `${oldPath}/${fileName}`, newPath);
			res.json({ success: 'Successfully moved item' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to move item.');
		}
	};
};

// Endpoint POST /api/files/copy
export const postCopyFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);
			const { newPath, fileName } = req.body;
			const oldPath = (req.headers.referer)?.split('/files')[1] ?? '';

			await client.FileManager.copy(session.user.id, `${oldPath}/${fileName}`, newPath);
			res.json({ success: 'Successfully copied file' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to copy item.');
		}
	};
};

// Endpoint GET /api/files/download
export const getDownloadFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);
			const { path: filePath } = req.query;

			// Fetch file from database
			const file = await client.FileManager.getByFilePath(session.user.id, filePath as string);
			if (!file) return Error.MissingResource(res, 'File not found');

			// Check if file is a file or actually a directory
			switch (file.type) {
				case 'FILE':
					return client.FileManager.downloadFile(res, session.user.id, filePath as string);
				case 'DIRECTORY':
					return client.FileManager.downloadDirectory(res, session.user.id, filePath as string);
				default:
					return Error.GenericError(res, 'Invalid file type');
			}
		} catch (error) {
			client.logger.error(error);
			Error.GenericError(res, 'Failed to download file.');
		}
	};
};

// Endpoint GET /api/files/bulk-download
export const getBulkDownload = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);
			const { paths } = req.body;

			const filesPaths: string[] = paths;
			client.FileManager.downloadFiles(res, session.user.id, filesPaths);
		} catch (error) {
			client.logger.error(error);
			Error.GenericError(res, 'Failed to download files.');
		}
	};
};


// Endpoint POST /api/files/rename
export const postRenameFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);
			const { oldName, newName } = req.body;
			const userPath = (req.headers.referer as string).split('/files')[1];
			const originalPath = decodeURI(userPath.startsWith('/') ? `${userPath}/` : '/');

			await client.FileManager.rename(session.user.id, `${originalPath}${oldName}`, newName);
			res.json({ success: 'Successfully renamed item' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to rename item.');
		}
	};
};

// Endpoint POST /api/files/create-folder
export const postCreateFolder = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			const { folderName } = req.body;
			if (typeof folderName !== 'string' || !folderName.trim()) return Error.IncorrectQuery(res, 'folderName is not a string');

			// Validate and sanitise the folder name
			const validFolderName = /^[a-zA-Z0-9 _-]+$/;
			const santisedFolderName = path.normalize(folderName).replace(/^[/\\]+/, '');
			if (!validFolderName.test(santisedFolderName)) return Error.IncorrectQuery(res, 'folderName contains invalid characters');

			// Check if the folder name is longer than max chars
			if (santisedFolderName.length > CONSTANTS.MAX_CHARS_FILE_NAME) return Error.IncorrectQuery(res, 'folderName is too long');

			// Decode & santise the referer path to ensure the folder is added to the correct path
			const userPath = decodeURI(req.headers['referer']?.split('/files')[1] || '/');
			if (userPath.length == 0) return Error.GenericError(res, 'Invalid path detected.');
			await client.FileManager.createDirectory(session.user.id, userPath.startsWith('/') ? userPath : `/${userPath}`, santisedFolderName);
			res.json({ success: 'Successfully created folder.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to create folder.');
		}
	};
};

// Endpoint GET /api/files/search
export const getSearchFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return res.json({ error: 'Invalid session' });

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

export const getAllDirectories = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return res.json({ error: 'Invalid session' });

			const dirs = await client.FileManager.getAllUsersDirectories(session.user.id);
			return res.json({ dirs: sanitiseObject(dirs) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get all user\'s directories.');
		}
	};
};