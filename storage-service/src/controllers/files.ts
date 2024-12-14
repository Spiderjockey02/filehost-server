import { Request, Response } from 'express';
import { PATHS, directoryTree, Error } from '../utils';
import { getSession, parseForm } from '../middleware';
import { updateUser } from '../accessors/User';
import fs from 'fs/promises';
import archiver from 'archiver';
import { TrashHandler } from '../libs';
import type { fileItem } from '../types';
const trash = new TrashHandler();

// Endpoint GET /api/files
export const getFiles = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

		// Fetch from cache
		const path = req.params.path as string;
		const files = await directoryTree(`${PATHS.CONTENT}/${session.user.id}${path ? `/${path}` : ''}`);

		// Update size
		if (path && path.length == 0 && (Number(files?.size) != Number(session.user.totalStorageSize))) {
			await updateUser({ id: session.user.id, totalStorageSize: `${Number(files?.size ?? 0)}` });
		}

		res.json({ files });
	};
};

// Endpoint GET /api/files/upload
export const postFileUpload = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		try {
			// Parse and save file(s)
			const { files } = await parseForm(req, session.user.id);
			const file = files.media;
			if (file == undefined) throw 'No files uploaded';
			const url = file.map((f) => f.filepath);

			return res
				.json({ success: `File(${Array.isArray(url) ? 's' : ''}) successfully uploaded.` });
		} catch (err) {
			console.log('erro2', err);
			res.json({ error: 'Failed to upload file' });
		}
	};
};

export const deleteFile = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		const { path } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await trash.addFileToPending(session.user.id, originalPath, path);
			res.json({ success: 'Successfully deleted item.' });
		} catch (err) {
			console.log(err);
			res.status(400).json({ error: 'Failed to delete item.' });
		}
	};
};

export const moveFile = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const { newPath, oldPath } = req.body;

		try {
			await fs.rename(`${PATHS.CONTENT}/${session.user.id}/${newPath}`, `${PATHS.CONTENT}/${session.user.id}/${oldPath}`);
			res.json({ success: 'Successfully moved item' });
		} catch (err) {
			res.status(400).json({ error: 'Failed to move item.' });
		}
	};
};

export const copyFile = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const { newPath, oldPath } = req.body;

		try {
			await fs.copyFile(`${PATHS.CONTENT}/${session.user.id}/${newPath}`, `${PATHS.CONTENT}/${session.user.id}/${oldPath}`);
			res.json({ success: 'Successfully copied file' });
		} catch (err) {
			res.status(400).json({ error: 'Failed to move item.' });
		}
	};
};

export const downloadFile = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const { path } = req.body;
		const archive = archiver('zip', { zlib: { level: 9 } });

		archive
			.directory(`${PATHS.CONTENT}/${session.user.id}${path}`, false)
			.on('error', () => res.status(400).json({ error: 'Error downloading item' }))
			.pipe(res);
		archive.finalize();
	};
};

export const renameFile = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const { oldPath, newPath } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await fs.rename(`${PATHS.CONTENT}/${session.user.id}${originalPath}${oldPath}`,
				`${PATHS.CONTENT}/${session.user.id}${originalPath}${newPath}.${oldPath.split('.').at(-1)}`);
			res.json({ success: 'Successfully renamed item' });
		} catch (err) {
			res.status(400).json({ error: 'Failed to rename item.' });
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