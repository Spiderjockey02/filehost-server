// For upload, delete, move etc endpoints
import { Router } from 'express';
import fs from 'fs/promises';
import archiver from 'archiver';
import { parseForm } from '../utils/parse-form';
import { PATHS } from '../utils/CONSTANTS';
import TrashHandler from '../utils/TrashHandler';
const trash = new TrashHandler();
const router = Router();

export default function() {
	// Upload a new file
	router.post('/upload/:userId', async (req, res) => {
		const userId = req.params.userId;

		try {
			// Parse and save file(s)
			const { files } = await parseForm(req, userId);
			const file = files.media;
			const url = Array.isArray(file) ? file.map((f) => f.filepath) : file.filepath;

			return res.status(200).json({ success: `File(${Array.isArray(url) ? 's' : ''}) successfully uploaded.` });
		} catch (err) {
			console.log(err);
			res.json({ error: 'Failed to upload file' });
		}
	});

	// Delete a file/folder
	router.post('/delete/:userId', async (req, res) => {
		const userId = req.params.userId as string;
		const { path } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await trash.addFile(userId, originalPath, path);
			res.json({ success: 'Successfully deleted item.' });
		} catch (err) {
			console.log(err);
			res.status(400).json({ error: 'Failed to delete item.' });
		}
	});

	// Move a file/folder to a new directory
	router.post('/move/:userId', async (req, res) => {
		const userId = req.params.userId as string;
		const { newPath, oldPath } = req.body;

		try {
			await fs.rename(`${PATHS.CONTENT}/${userId}/${newPath}`, `${PATHS.CONTENT}/${userId}/${oldPath}`);
			res.json({ success: 'Successfully moved item' });
		} catch (err) {
			res.status(400).json({ error: 'Failed to move item.' });
		}
	});

	// Copy a file to a new directory
	router.post('/copy/:userId', async (req, res) => {
		const userId = req.params.userId as string;
		const { newPath, oldPath } = req.body;

		try {
			await fs.copyFile(`${PATHS.CONTENT}/${userId}/${newPath}`, `${PATHS.CONTENT}/${userId}/${oldPath}`);
			res.json({ success: 'Successfully copied file' });
		} catch (err) {
			res.status(400).json({ error: 'Failed to move item.' });
		}
	});

	// Download folder
	router.get('/download/:userId', async (req, res) => {
		const userId = req.params.userId;
		const { path } = req.body;
		const archive = archiver('zip', { zlib: { level: 9 } });

		archive
			.directory(`${PATHS.CONTENT}/${userId}${path}`, false)
			.on('error', () => res.status(400).json({ error: 'Error downloading item' }))
			.pipe(res);
		archive.finalize();
	});

	router.post('/rename/:userId', async (req, res) => {
		const userId = req.params.userId;
		const { oldPath, newPath } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await fs.rename(`${PATHS.CONTENT}/${userId}${originalPath}${oldPath}`,
				`${PATHS.CONTENT}/${userId}${originalPath}${newPath}.${oldPath.split('.').at(-1)}`);
			res.json({ success: 'Successfully renamed item' });
		} catch (err) {
			res.status(400).json({ error: 'Failed to rename item.' });
		}
	});

	return router;
}
