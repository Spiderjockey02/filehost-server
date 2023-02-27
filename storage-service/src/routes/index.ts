import { Router } from 'express';
import fs from 'fs';
import { lookup } from 'mime-types';
import { spawn } from 'child_process';
import { createThumbnail } from '../utils/functions';
import { updateUserRecentFiles } from '../db/Recent';
import { PATHS } from '../utils/CONSTANTS';
import { getSession } from '../utils/functions';
const router = Router();

export default function() {

	router.get('/avatar', async (req, res) => {
		const session = await getSession(req);
		if (!session.user) return res.json({ error: 'Invalid session' });

		// Check if the user already has an avatar, if not display default one
		res.sendFile(`${PATHS.AVATAR}/${fs.existsSync(`${PATHS.AVATAR}/${session.user.id}.webp`) ? session.user.id : 'default-avatar'}.webp`);
	});

	router.get('/thumbnail/:userid/:path(*)', async (req, res) => {
		const userId = req.params.userid as string;
		const path = req.params.path as string;

		const fileType = lookup(path);
		const fileName = path.substring(0, path.lastIndexOf('.')) || path;
		if (fileType !== false) {
			// Create folder (if needed to)
			const folder = path.split('/').slice(0, -1).join('/');
			if (!fs.existsSync(`${PATHS.THUMBNAIL}/${userId}/${folder}`)) fs.mkdirSync(`${PATHS.THUMBNAIL}/${userId}/${folder}`, { recursive: true });

			// Create thumbnail from video, photo
			switch (fileType.split('/')[0]) {
				case 'image': {
					// Create thumbnail if not already created
					try {
						if (!fs.existsSync(`${PATHS.THUMBNAIL}/${userId}/${decodeURI(fileName)}.jpg`)) await createThumbnail(userId, path);
						return res.sendFile(`${PATHS.THUMBNAIL}/${userId}/${decodeURI(fileName)}.jpg`);
					} catch (err) {
						console.log(err);
						return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);
					}
				}
				case 'video': {
					if (!fs.existsSync(`${PATHS.THUMBNAIL}/${userId}/${fileName}.jpg`)) {
						const child = spawn('ffmpeg',
							['-i', `${PATHS.CONTENT}/${userId}/${path}`,
								'-ss', '00:00:01.000', '-vframes', '1',
								`${PATHS.THUMBNAIL}/${userId}/${fileName}.jpg`,
							]);

						await new Promise((resolve, reject) => {
							child.on('close', resolve);
							child.on('error', (err) => {
								console.log(err);
								reject();
							});
						});
					}
					return res.sendFile(`${PATHS.THUMBNAIL}/${userId}/${fileName}.jpg`);
				}
			}
		}

		return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);
	});

	router.get('/content/:userid/:path(*)', async (req, res) => {
		const userId = req.params.userid as string;
		const path = req.params.path as string;

		const fileType = lookup(path);
		if (fileType == false) return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);

		// update the user's recent access files
		try {
			await updateUserRecentFiles({ userId, path });
		} catch (err: any) {
			console.log(err);
		}

		// Check what type of file it is, to send the relevent data
		switch(fileType.split('/')[0]) {
			case 'image':
				return res.sendFile(`${PATHS.CONTENT}/${userId}/${path}`);
			case 'video': {
				const range = req.headers.range;
				// Get video stats
				const videoSize = fs.statSync(`${PATHS.CONTENT}/${userId}/${path}`).size;
				if (!range) {
					res.writeHead(200, {
						'content-length': videoSize + 1,
						'content-type': 'video/mp4',
					});
					fs.createReadStream(`${PATHS.CONTENT}/${userId}/${path}`).pipe(res);
				} else {
					// Send chunks of 2MB = 2 * (10 ** 6)
					const CHUNK_SIZE = 2 * (10 ** 6);
					const start = Number(range.replace(/\D/g, ''));
					const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

					// Create headers
					const contentLength = end - start + 1;
					const headers = {
						'content-range': `bytes ${start}-${end}/${videoSize}`,
						'accept-ranges': 'bytes',
						'content-length': contentLength,
						'content-type': 'video/mp4',
						'range': `bytes ${start}-${end}/${videoSize}`,
					};

					// HTTP Status 206 for Partial Content
					res.writeHead(206, headers);

					// create video read stream for this particular chunk
					const videoStream = fs.createReadStream(`${PATHS.CONTENT}/${userId}/${path}`, { start, end });

					// Stream the video chunk to the client
					videoStream.pipe(res);
				}
			}
		}
	});

	return router;
}
