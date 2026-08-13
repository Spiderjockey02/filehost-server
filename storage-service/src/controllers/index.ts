import { S3ServiceException } from '@aws-sdk/client-s3';
import { Error, getIP, sanitiseObject } from '@/utils';
import type { User } from '@/types/generated/client';
import type { Request, Response } from 'express';
import { validateUserId } from '@/validators';
import type Client from '@/helpers/Client';
import { getSession } from '@/middleware';

// Endpoint GET /avatar/:userId
export const getAvatar = (client: Client) => {
	return async (req: Request, res: Response) => {
		const userId = req.params['userId'];

		// Validate userId
		const result = validateUserId.safeParse(userId);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		return client.FileManager.sendAvatar(res, result.data);
	};
};

// Endpoint GET /thumbnail/:userid/:path(*)
export const getThumbnail = (client: Client) => {
	return async (req: Request, res: Response) => {
		// Validate userId
		const userIdResult = validateUserId.safeParse(req.params['userid']);
		if (!userIdResult.success) return Error.IncorrectQuery(res, userIdResult.error.issues);

		// Validate path
		const pathParam = req.params['path'];
		if (!Array.isArray(pathParam) || pathParam.length === 0) return Error.IncorrectQuery(res, [{ message: 'Invalid file path.' }]);
		const path = pathParam.join('/');

		// Make sure they have access to view the thumbnail
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		if (session.user.id !== userIdResult.data) return Error.InvalidAccess(res);

		await client.FileManager.sendThumbnail(res, userIdResult.data, path);
	};
};

// Endpoint GET /content/:userid/:path(*)
export const getContent = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		// Validate userId
		const userIdResult = validateUserId.safeParse(req.params['userid']);
		if (!userIdResult.success) return Error.IncorrectQuery(res, userIdResult.error.issues);

		// Validate path
		const pathParam = req.params['path'];
		if (!Array.isArray(pathParam) || pathParam.length === 0) return Error.IncorrectQuery(res, [{ message: 'Invalid file path.' }]);
		const path = pathParam.join('/');

		// Fetch file from database
		const file = await client.FileManager.fetchByFilePath(userIdResult.data, path);
		if (file == null || file.deletedAt !== null) return Error.MissingResource(res);

		// Make sure they have access to view the file
		if (file.userId !== session.user.id) return Error.InvalidAccess(res);

		// Update the user's recently viewed file history
		await client.recentlyViewedFileManager.upsert({ userId: userIdResult.data, fileId: file.id }).catch(client.logger.error);

		try {
			const owner = await client.userManager.fetchbyParam({ id: file.userId }) as User;
			await client.FileManager.sendFile(res, owner, file, req.headers.range);

			if (file.mimetype?.startsWith('video') && req.headers.range !== 'bytes=0-') return;
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_VIEWED',
					message: 'File was viewed.',
					resourceId: file.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
		} catch (err) {
			if (err instanceof S3ServiceException) {
				client.logger.error(`S3 error: ${err}`);
				if (err.name == 'NotFound' && !res.headersSent) Error.MissingResource(res);
			} else {
				client.logger.error(`Non-S3 error: ${err}`);
				if (!res.headersSent) Error.GenericError(res, 'Failed to send file');
			}

			// Don't log errors if the user is just updating playback (it will abort the old request to send the new, resulting in an error being thrown)
			if (`${err}` == 'Error: aborted') return;
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				client.AuditLogManager.create({
					userId: session.user.id,
					resourceType: 'FILE',
					eventName: 'FILE_VIEWED',
					message: `Failed to view file due to error: ${err}.`,
					resourceId: file.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
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
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to get statistics');
		}
	};
};

// Endpoint GET /plans
export const getPlans = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const plans = await client.PlanManager.fetchAll();
			res.json({ plans: sanitiseObject(plans) });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to get plans');
		}
	};
};

// Endpoint GET /metadata/:fileId
export const getFilesMetadata = (client: Client) => {
	return async (req: Request, res: Response) => {
		// Validate file ID
		const fileId = req.params['fileId'];
		if (typeof fileId !== 'string') return Error.IncorrectQuery(res, [{ message: 'File ID is required.' }]);

		try {
			// Make sure only the file's owner can get the metadata
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// Check the owner of the files
			const file = await client.FileManager.fetchById(fileId);
			if (file == null) return Error.MissingResource(res);
			if (file.userId !== session.user.id) return Error.InvalidAccess(res);

			const metadata = await client.FileManager.fetchFilesMetadata(file.id);
			res.json({ metadata: { ...metadata, exif: undefined } });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch file\'s metadata');
		}
	};
};