// For upload, delete, move etc endpoints
import { Router } from 'express';
import fs from 'fs/promises';
import archiver from 'archiver';
import directoryTree from '../utils/directory';
import { parseForm } from '../utils/parse-form';
const router = Router();

const PATHS = {
	AVATAR: `${process.cwd()}/src/uploads/avatars`,
	THUMBNAIL: `${process.cwd()}/src/uploads/thumbnails`,
	CONTENT: `${process.cwd()}/src/uploads/content`,
};

export default function() {
	// Upload a new file
	router.post('/upload/:userId', async (req, res) => {
		const userId = req.params.userId;
		const { files } = await parseForm(req, userId);

		const file = files.media;
		const url = Array.isArray(file) ? file.map((f) => f.filepath) : file.filepath;

		return res.status(200).json({
			data: {
				url,
			},
			error: null,
		});
	});

	// Delete a file/folder
	router.post('/delete/:userId', async (req, res) => {
		const userId = req.params.userId as string;
		const { path } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await fs.rm(`${PATHS.CONTENT}/${userId}${originalPath}${path}`, { recursive: true, force: true });
			res.json({ success: 'Successfully deleted item.' });
		} catch (err) {
			res.json({ error: 'Failed to delete item.' });
		}
	});

	// Move a file/folder to a new directory
	router.post('/move/:userId', async (req, res) => {
		const userId = req.params.userId as string;
		const { newPath, oldPath } = req.body;

		try {
			await fs.rename(`${PATHS.CONTENT}/${userId}/${newPath}`, `${PATHS.CONTENT}/${userId}/${oldPath}`);
		} catch (err) {
			res.json({ error: 'Failed to move item.' });
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
			res.json({ error: 'Failed to move item.' });
		}
	});

	// Download folder
	router.get('/download/:userId', async (req, res) => {
		const userId = req.params.userId;
		const { path } = req.body;
		const archive = archiver('zip', { zlib: { level: 9 } });

		archive
			.directory(`${PATHS.CONTENT}/${userId}${path}`, false)
			.on('error', () => res.json({ error: 'Error downloading item' }))
			.pipe(res);
		archive.finalize();

	});

	router.get('/fetch/:userId/:path(*)', (req, res) => {
		const userid = req.params.userId;
		const path = req.params.path as string;

		res.json({ files: directoryTree(`${PATHS.CONTENT}/${userid}${path ? `/${path}` : ''}`) });
	});

	router.post('/rename/:userId', async (req, res) => {
		const userId = req.params.userId;
		const { oldPath, newPath } = req.body;
		const userPath = (req.headers.referer as string).split('/files')[1];
		const originalPath = userPath.startsWith('/') ? userPath : '/';

		try {
			await fs.rename(`${PATHS.CONTENT}/${userId}${originalPath}${oldPath}`,
				`${PATHS.CONTENT}/${userId}${originalPath}${newPath}.${oldPath.split('.').at(-1)}`);
			res.json({ success: 'Successfully renamed file' });
		} catch (err) {
			res.json({ error: 'Failed to rename item.' });
		}
	});

	return router;
}
