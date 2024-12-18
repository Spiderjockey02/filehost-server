import { Request, Response } from 'express';
import { PATHS, directoryTree, Error, Client } from '../utils';
import { getSession, parseForm } from '../middleware';
import fs from 'fs/promises';
import archiver from 'archiver';
import { TrashHandler } from '../libs';
import type { fileItem } from '../types';
const trash = new TrashHandler();

// Endpoint GET /api/files
export const getFiles = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

		// Fetch from cache
		const path = req.params.path;
		let files = client.treeCache.get(`${session.user.id}_${path ? `/${path}` : ''}`) ?? null;
		if (files == undefined) {
			files = await directoryTree(`${PATHS.CONTENT}/${session.user.id}${path ? `/${path}` : ''}`);
		}

		// Update size
		if (path.length == 0 && (files?.size != session.user.totalStorageSize)) {
			await client.userManager.update({ id: session.user.id, totalStorageSize: Number(files?.size ?? 0) });
		}

		res.json({ files });
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

		const { path } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await trash.addFileToPending(session.user.id, originalPath, path);
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
			Error.GenericError(res, 'Failed to move item.');
		}
	};
};

export const downloadFile = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');
		const { path } = req.body;
		const archive = archiver('zip', { zlib: { level: 9 } });

		archive
			.directory(`${PATHS.CONTENT}/${session.user.id}${path}`, false)
			.on('error', (err) => {
				client.logger.error(err);
				Error.GenericError(res, 'Error downloading item');
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

interface srchQuery {
	path: string
	name: string
}

function search(files: Array<fileItem> | undefined, text: string, arr: Array<srchQuery> = []) {
	if (files == undefined) return arr;
	for (const i of files) {
		if (i.type == 'file') {
			if (i.name.startsWith(text)) arr.push({ path: i.path.replace(`${PATHS.CONTENT}`, 's'), name: i.name });
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