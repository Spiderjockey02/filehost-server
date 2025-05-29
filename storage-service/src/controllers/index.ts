import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import { getSession } from '../middleware';
import { Error, PATHS } from '../utils';
import { User } from '@prisma/client';

// Endpoint GET /avatar/:userId?
export const getAvatar = (client: Client) => {
	return async (req: Request, res: Response) => {
		let userId;
		if (req.params.userId) {
			userId = req.params.userId;
		} else {
			const session = await getSession(client, req);
			if (!session?.user) return Error.InvalidSession(res);
			userId = session.user.id;
		}

		client.FileManager.sendAvatar(res, userId);
	};
};

// Endpoint GET /thumbnail/:userid/:path(*)
export const getThumbnail = (client: Client) => {
	return async (req: Request, res: Response) => {
		const userId = req.params.userid;
		const path = req.params.path;

		try {
			// Make sure they have access to view the thumbnail
			const session = await getSession(client, req);
			if (!session?.user) return Error.InvalidSession(res);
			if (session.user.id !== userId) return Error.InvalidAccess(res);

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
		const session = await getSession(client, req);
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

		const owner = await client.userManager.fetchbyParam({ id: file.userId }) as User;
		client.FileManager.sendFile(res, owner, file, req.headers.range);
	};
};

export const getStatistics = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [totalUsers, diskData, totalFileCount] = await Promise.all([client.userManager.fetchTotal(), client.FileManager.getFileSystemStatistics(), client.FileManager.fetchTotal()]);

			res.json({ totalUsers, diskData, totalFileCount: totalFileCount.files + totalFileCount.folders });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to get statistics');
		}
	};
};