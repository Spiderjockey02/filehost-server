import { Request, Response } from 'express';
import { PATHS, directoryTree, Error, Client } from '../utils';
import { getSession, parseForm } from '../middleware';
import fs from 'fs/promises';
import archiver from 'archiver';
import { TrashHandler } from '../libs';
import type { fileItem } from '../types';
import path from 'node:path';
const trash = new TrashHandler();

// Endpoint GET /api/files
export const getFiles = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

			// Fetch from cache
			const filePath = req.params.path;
			const files = client.treeCache.get(`${session.user.id}_${filePath ? `/${filePath}` : ''}`)
				?? await directoryTree(path.join(PATHS.CONTENT, session.user.id, `${filePath ? `/${filePath}` : ''}`));

			res.json({ files });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch file.');
		}
	};
};

// Endpoint GET /api/files/upload
export const postFileUpload = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

		try {
			// Parse and save file(s)
			const { files } = await parseForm(client, req, session.user.id);
			const file = files.media;
			if (file == undefined) throw 'No files uploaded';
			const url = file.map((f) => f.filepath);

			return res.json({ success: `File(${Array.isArray(url) ? 's' : ''}) successfully uploaded.` });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to upload file.');
		}
	};
};

export const deleteFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

		const { path: filePath } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await trash.addFileToPending(session.user.id, originalPath, filePath);
			res.json({ success: 'Successfully deleted item.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete item.');
		}
	};
};

export const moveFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');
		const { newPath, oldPath } = req.body;

		try {
			await fs.rename(`${PATHS.CONTENT}/${session.user.id}/${newPath}`, `${PATHS.CONTENT}/${session.user.id}/${oldPath}`);
			res.json({ success: 'Successfully moved item' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to move item.');
		}
	};
};

export const copyFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');
		const { newPath, oldPath } = req.body;

		try {
			await fs.copyFile(`${PATHS.CONTENT}/${session.user.id}/${newPath}`, `${PATHS.CONTENT}/${session.user.id}/${oldPath}`);
			res.json({ success: 'Successfully copied file' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to copy item.');
		}
	};
};

export const downloadFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');
		const { path: filePath } = req.body;
		const archive = archiver('zip', { zlib: { level: 9 } });

		archive
			.directory(`${PATHS.CONTENT}/${session.user.id}${filePath}`, false)
			.on('error', (err) => {
				client.logger.error(err);
				Error.GenericError(res, 'Failed to download file.');
			})
			.pipe(res);
		archive.finalize();
	};
};

export const renameFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');
		const { oldPath, newPath } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await fs.rename(`${PATHS.CONTENT}/${session.user.id}${originalPath}${oldPath}`,
				`${PATHS.CONTENT}/${session.user.id}${originalPath}${newPath}.${oldPath.split('.').at(-1)}`);
			res.json({ success: 'Successfully renamed item' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to rename item.');
		}
	};
};

export const createFolder = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

		try {
			const { folderName } = req.body;
			if (typeof folderName !== 'string' || !folderName.trim()) return Error.IncorrectBodyValue(res, 'folderName is not a string');

			// Validate and sanitise the folder name
			const validFolderName = /^[a-zA-Z0-9 _-]+$/;
			const santisedFolderName = path.normalize(folderName).replace(/^[/\\]+/, '');
			if (!validFolderName.test(santisedFolderName)) return Error.IncorrectBodyValue(res, 'folderName contains invalid characters');

			// Decode & santise the referer path to ensure the folder is added to the correct path
			const userPath = decodeURI(req.headers['referer']?.split('/files')[1] || '');
			const santisedPath = path.normalize(`${userPath}`).replace(/^[/\\]+/, '');
			if (santisedPath.length == 0) return Error.GenericError(res, 'Invalid path detected.');

			// Ensure they have not escaped their directory (directory traversal attacks)
			const userBasePath = path.resolve(PATHS.CONTENT, session.user.id);
			const targetPath = path.resolve(userBasePath, santisedPath, santisedFolderName);
			if (!targetPath.startsWith(userBasePath)) return Error.GenericError(res, 'Invalid path detected.');

			// Create folder
			await fs.mkdir(targetPath);
			res.json({ success: 'Successfully created folder.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to create folder.');
		}
	};
};

interface srchQuery {
	path: string
	name: string
}

function search(files: Array<fileItem> | undefined, text: string, arr: Array<srchQuery> = []) {
	if (files == undefined) return arr;
	for (const i of files) {
		if (i.type == 'file') {
			if (i.name.startsWith(text)) arr.push({ path: '', name: i.name });
		} else {
			arr.push(...search(i.children, text, []));
		}
	}

	return arr;
}

export const searchFile = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		const srch = req.query.search as string;
		const files = (await directoryTree(`${PATHS.CONTENT}/${session.user.id}`, 100))?.children;

		res.json({ query: search(files, srch).map((i) => ({ ...i, path: i.path.split(`${session.user?.id}`)[1] })) });
	};
};