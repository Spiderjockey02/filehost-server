import { Request, Response } from 'express';
import { lookup } from 'mime-types';
import fs from 'node:fs';
import { PATHS, Error } from '../utils';
import { getSession } from '../middleware';
import { Client } from 'src/helpers';

// Endpoint GET /avatar/:userId?
export const getAvatar = () => {
	return async (req: Request, res: Response) => {
		let userId;
		if (req.params.userId) {
			userId = req.params.userId;
		} else {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);
			userId = session.user.id;
		}

		// Check if the user already has an avatar, if not display default one
		const avatarPath = fs.existsSync(`${PATHS.AVATAR}/${userId}.webp`) ? userId : 'default-avatar';
		res.sendFile(`${PATHS.AVATAR}/${avatarPath}.webp`);
	};
};

// Endpoint GET /thumbnail/:userid/:path(*)
export const getThumbnail = (client: Client) => {
	return async (req: Request, res: Response) => {
		const userId = req.params.userid as string;
		const path = req.params.path as string;

		return client.FileManager.getThumbnail(res, userId, path);
	};
};

// Endpoint GET /content/:userid/:path(*)
export const getContent = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.InvalidSession(res);

		const userId = req.params.userid as string;
		const path = req.params.path as string;

		// Fetch file from database
		const file = await client.FileManager.getByFilePath(userId, path);
		if (!file || file.userId !== session.user.id) return Error.MissingResource(res, 'File not found');

		// Update the user's recently viewed file history
		try {
			await client.recentlyViewedFileManager.upsert({ userId, fileId: file.id });
		} catch (error) {
			client.logger.error(error);
		}

		const fileType = lookup(file.path);
		if (fileType == false || fileType == 'application/javascript') {
			const t = fs.readFileSync(`${PATHS.CONTENT}/${userId}/${path}`, { encoding: 'utf-8' });
			res.type('text/plain');
			return res.send(t);
		}

		if (fileType == 'application/pdf') return res.sendFile(`${PATHS.CONTENT}/${userId}/${path}`);

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
				break;
			}
			case 'text': {
				const t = fs.readFileSync(`${PATHS.CONTENT}/${userId}/${path}`, { encoding: 'utf-8' });
				res.type('text/plain');
				return res.send(t);
			}
		}
	};
};

export const getStatistics = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [totalUsers, diskData, totalFileCount] = await Promise.all([client.userManager.fetchTotal(), client.FileManager.getFileSystemStatitics(), client.FileManager.fetchTotal()]);

			res.json({ totalUsers, diskData, totalFileCount });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to get statistics');
		}
	};
};