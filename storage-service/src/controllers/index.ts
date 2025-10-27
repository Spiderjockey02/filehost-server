import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import { getSession } from '../middleware';
import { Error, sanitiseObject } from '../utils';
import { User } from '@prisma/client';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { fetchAllPlans } from '../accessors/Plan';

// Endpoint GET /avatar/:userId
export const getAvatar = (client: Client) => {
	return async (req: Request, res: Response) => {
		client.FileManager.sendAvatar(res, req.params.userId);
	};
};

// Endpoint GET /thumbnail/:userid/:path(*)
export const getThumbnail = (client: Client) => {
	return async (req: Request<{ userid: string, path: string[] }>, res: Response) => {
		const userId = req.params.userid;
		const path = req.params.path.join('/');

		// Make sure they have access to view the thumbnail
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		if (session.user.id !== userId) return Error.InvalidAccess(res);

		await client.FileManager.sendThumbnail(res, userId, path);
	};
};

// Endpoint GET /content/:userid/:path(*)
export const getContent = (client: Client) => {
	return async (req: Request<{ userid: string, path: string[] }>, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		const userId = req.params.userid;
		const path = req.params.path.join('/');

		// Fetch file from database
		const file = await client.FileManager.getByFilePath(userId, path);
		if (file == null) return Error.MissingResource(res, 'File not found');

		// Make sure they have access to view the file
		if (file.userId !== session.user.id) return Error.InvalidAccess(res);

		// Update the user's recently viewed file history
		await client.recentlyViewedFileManager.upsert({ userId, fileId: file.id }).catch(client.logger.error);

		try {
			const owner = await client.userManager.fetchbyParam({ id: file.userId }) as User;
			await client.FileManager.sendFile(res, owner, file, req.headers.range);
		} catch (err) {
			if (err instanceof S3ServiceException) {
				client.logger.error(`S3 error: ${err}`);
				if (err.name == 'NotFound') return Error.MissingResource(res, 'File not found on storage server.');
			} else {
				client.logger.error(`Non-S3 error: ${err}`);
				return Error.GenericError(res, 'Failed to send file');
			}
		}
	};
};

// Endpoint GET /statistics
export const getStatistics = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [totalUsers, totalUsage, totalFileCount] = await Promise.all([
				client.userManager.fetchTotal(),
				client.FileManager.storageManager.fetchGlobalUsage(),
				client.FileManager.fetchTotal(),
			]);

			res.json({ totalUsers, totalUsage: Number(totalUsage._sum.usedSize ?? 0), totalFileCount: totalFileCount.files + totalFileCount.folders });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to get statistics');
		}
	};
};

// Endpoint GET /plans
export const getPlans = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const plans = await fetchAllPlans();
			res.json({ plans: sanitiseObject(plans) });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to get plans');
		}
	};
};