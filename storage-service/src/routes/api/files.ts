// For upload, delete, move etc endpoints
import { Router } from 'express';
import fs from 'fs/promises';
import archiver from 'archiver';
import { parseForm, getSession } from '../../middleware';
import { PATHS } from '../../utils/CONSTANTS';
import { TrashHandler } from '../../libs';
import directoryTree from '../../utils/directory';
import type { fileItem } from '../../types';
const trash = new TrashHandler();
const router = Router();

export default function() {
	// Upload a new file
	router.post('/upload', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		try {
			// Parse and save file(s)
			const { files } = await parseForm(req, session.user.id);
			const file = files.media;
			const url = Array.isArray(file) ? file.map((f) => f.filepath) : file.filepath;

			return res
				.setHeader('Content-Type', 'application/json')
				.status(200)
				.json({ success: `File(${Array.isArray(url) ? 's' : ''}) successfully uploaded.` });
		} catch (err) {
			console.log('erro2', err);
			res
				.setHeader('Content-Type', 'application/json')
				.json({ error: 'Failed to upload file' });
		}
	});

	// Delete a file/folder
	router.post('/delete', async (req, res) => {
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
	});

	// Move a file/folder to a new directory
	router.post('/move', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const { newPath, oldPath } = req.body;

		try {
			await fs.rename(`${PATHS.CONTENT}/${session.user.id}/${newPath}`, `${PATHS.CONTENT}/${session.user.id}/${oldPath}`);
			res.json({ success: 'Successfully moved item' });
		} catch (err) {
			res.status(400).json({ error: 'Failed to move item.' });
		}
	});

	// Copy a file to a new directory
	router.post('/copy', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const { newPath, oldPath } = req.body;

		try {
			await fs.copyFile(`${PATHS.CONTENT}/${session.user.id}/${newPath}`, `${PATHS.CONTENT}/${session.user.id}/${oldPath}`);
			res.json({ success: 'Successfully copied file' });
		} catch (err) {
			res.status(400).json({ error: 'Failed to move item.' });
		}
	});

	// Download folder
	router.get('/download', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const { path } = req.body;
		const archive = archiver('zip', { zlib: { level: 9 } });

		archive
			.directory(`${PATHS.CONTENT}/${session.user.id}${path}`, false)
			.on('error', () => res.status(400).json({ error: 'Error downloading item' }))
			.pipe(res);
		archive.finalize();
	});


	// Rename a file/folder
	router.post('/rename', async (req, res) => {
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
	});

	router.get('/search', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		const srch = req.query.search as string;
		const files = (await directoryTree(`${PATHS.CONTENT}/${session.user.id}`, 100))?.children;

		res.json({ query: search(files, srch).map((i) => ({ ...i, path: i.path.split(`${session.user?.id}`)[1] })) });
	});

	return router;
}

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
