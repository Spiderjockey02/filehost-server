import { Router } from 'express';
import fs from 'fs';
import directoryTree from '../utils/directory';
import { lookup } from 'mime-types';
import { spawn } from 'child_process';
import{ createThumbnail } from '../utils/functions';
const router = Router();

const PATHS = {
	AVATAR: `${process.cwd()}/src/uploads/avatars`,
	THUMBNAIL: `${process.cwd()}/src/uploads/thumbnails`,
	CONTENT: `${process.cwd()}/src/uploads/content`,
};

export default function() {

	router.get('/avatar/:userid', (req, res) => {
		const userid = req.params.userid;

		// Check if the user already has an avatar, if not display default one
		res.sendFile(`${PATHS.AVATAR}/${fs.existsSync(`${PATHS.AVATAR}/${userid}.webp`) ? userid : 'default-avatar'}.webp`);
	});

	router.get('/fetch-files/:userid/:path?', (req, res) => {
		const userid = req.params.userid,
			path = req.params.path;


		if (fs.existsSync(`${PATHS.CONTENT}/${userid}${path ? `/${path.replace('_', '/')}` : ''}`)) {
			res.json({ files: directoryTree(`${PATHS.CONTENT}/${userid}${path ? `/${path.replace('_', '/')}` : ''}`) });
		} else {
			res.json({ files: null });
		}
	});

	router.get('/thumbnail/:userid/:path(*)', async (req, res) => {
		const userId = req.params.userid as string;
		const path = req.params.path as string;

		const fileType = lookup(path);
		if (fileType !== false) {
			switch (fileType.split('/')[0]) {
				case 'image': {
					createThumbnail(`${PATHS.CONTENT}/${userId}/${path}`);
					if (fs.existsSync(`${PATHS.THUMBNAIL}/${userId}/${path}.webp`)) {
						return res.sendFile(`${PATHS.THUMBNAIL}/${userId}/${path}.webp`);
					} else {
						createThumbnail(`${PATHS.CONTENT}/${userId}/${path}`);
						return res.sendFile(`${PATHS.CONTENT}/${userId}/${path}`);
					}
				}
				case 'video': {
					if (fs.existsSync(`${PATHS.THUMBNAIL}/${userId}/${path}.webp`)) {
						return res.sendFile(`${PATHS.THUMBNAIL}/${userId}/${path}.webp`);
					} else {
						const child = spawn('ffmpeg',
							['-i', `${PATHS.CONTENT}/${userId}/${path}`,
								'-ss', '00:00:01.000', '-vframes', '1',
								`${PATHS.THUMBNAIL}/${userId}/${path}.webp`,
							]);

						await new Promise((resolve, reject) => {
							child.on('close', resolve);
							child.on('error', (err) => {
								console.log(err);
								reject();
							});
						});
						return res.sendFile(`${PATHS.THUMBNAIL}/${userId}/${path}.webp`);
					}
				}
			}
		}

		return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);
	});

	router.post('/upload', () => {
		// Upload new file
	});
	return router;
}
