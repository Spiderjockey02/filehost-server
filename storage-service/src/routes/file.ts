// For upload, delete, move etc endpoints
import { Router } from 'express';
import fs from 'fs/promises';
import archiver from 'archiver';
import directoryTree from '../utils/directory';
const router = Router();

const PATHS = {
	AVATAR: `${process.cwd()}/src/uploads/avatars`,
	THUMBNAIL: `${process.cwd()}/src/uploads/thumbnails`,
	CONTENT: `${process.cwd()}/src/uploads/content`,
};

export default function() {
	// Upload a new file
	router.post('/upload/:userId', async (req, res) => {
		const userId = req.params.userId as string;
		res.json({ success: userId });
	});

	// Delete a file/folder
	router.post('/delete/:userId', async (req, res) => {
		const userId = req.params.userId as string;
		const { path } = req.body;

		try {
			await fs.rm(`${PATHS.CONTENT}/${userId}/${path}`, { recursive: true, force: true });
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
			.on('error', err => console.log(err))
			.pipe(res);
		archive.finalize();
	});

	router.get('/fetch/:userid/:path(*)', (req, res) => {
		const userid = req.params.userid;
		const path = req.params.path as string;

		res.json({ files: directoryTree(`${PATHS.CONTENT}/${userid}${path ? `/${path}` : ''}`) });
	});

	return router;
}
