import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import { getSession } from '../middleware';
import { Error, PATHS } from '../utils';

// Endpoint GET /avatar/:userId?
export const getAvatar = (client: Client) => {
	return async (req: Request, res: Response) => {
		let userId;
		if (req.params.userId) {
			userId = req.params.userId;
		} else {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);
			userId = session.user.id;
		}

		client.FileManager.sendAvatar(res, userId);
	};
};

// Endpoint GET /thumbnail/:userid/:path(*)
export const getThumbnail = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const userId = req.params.userid;
			const path = req.params.path;

			await client.FileManager.sendThumbnail(res, userId, path);
		} catch (error) {
			client.logger.error(error);
			res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);
		}
	};
};

// Endpoint GET /content/:userid/:path(*)
export const getContent = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return Error.InvalidSession(res);

		const userId = req.params.userid;
		const path = req.params.path;

		// Fetch file from database
		const file = await client.FileManager.getByFilePath(userId, path);
		if (!file || file.userId !== session.user.id) return Error.MissingResource(res, 'File not found');

		// Update the user's recently viewed file history
		try {
			await client.recentlyViewedFileManager.upsert({ userId, fileId: file.id });
		} catch (error) {
			client.logger.error(error);
		}
		client.FileManager.sendFile(res, file, req.headers.range);
	};
};

export const getStatistics = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [totalUsers, diskData, totalFileCount] = await Promise.all([client.userManager.fetchTotal(), client.FileManager.getFileSystemStatistics(), client.FileManager.fetchTotal()]);

			res.json({ totalUsers, diskData, totalFileCount });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to get statistics');
		}
	};
};