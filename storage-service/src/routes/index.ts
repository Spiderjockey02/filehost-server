import { Router } from 'express';
import fs from 'fs';
import directoryTree from '../utils/directory';
const router = Router();

export default function() {

	router.get('/avatar/:userid', (req, res) => {
		// return the avatar of the user
		const userid = req.params.userid;

		if (fs.existsSync(`${process.cwd()}/src/uploads/avatars/${userid}.webp`)) {
			res.sendFile(`${process.cwd()}/src/uploads/avatars/${userid}.webp`);
		} else {
			res.sendFile(`${process.cwd()}/src/uploads/avatars/default-avatar.webp`);
		}
	});

	router.get('/fetch-files/:userid/:path?', (req, res) => {
		const userid = req.params.userid;
		const path = req.params.path;

		console.log(path);
		console.log(`${process.cwd()}/src/uploads/content/${userid}${path ? `/${path.replace('_', '/')}` : ''}`);
		if (fs.existsSync(`${process.cwd()}/src/uploads/content/${userid}${path ? `/${path.replace('_', '/')}` : ''}`)) {
			res.json({ files: directoryTree(`${process.cwd()}/src/uploads/content/${userid}${path ? `/${path.replace('_', '/')}` : ''}`) });
		} else {
			res.json({ files: null });
		}
	});

	router.get('/thumbnail/:userid/:path', (req, res) => {
		const userid = req.params.userid;
		const path = req.params.path;

		if (fs.existsSync(`${process.cwd()}/src/uploads/thumbnails/${userid}/${path}`)) {
			res.sendFile(`${process.cwd()}/src/uploads/thumbnails/${userid}/${path}`);
		} else {
			res.sendFile(`${process.cwd()}/src/uploads/thumbnails/missing-file-icon.png`);
		}
	});

	return router;
}
