import { validateCacheName } from '@/validators/admin';
import type { Request, Response } from 'express';
import type Client from '@/helpers/Client';
import { Error } from '@/utils';

// Endpoint: DELETE /api/admin/cache/:name
export const deleteCacheByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		const result = validateCacheName.safeParse(req.params['name']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			switch (result.data) {
				case 'users':
					client.userManager.cache.clear();
					break;
				case 'files':
					client.FileManager.cache.clear();
					break;
				case 'history':
					client.recentlyViewedFileManager.cache.clear();
					break;
				case 'sessions':
					client.sessionManager.cache.clear();
					break;
				case 'mimetype':
					client.FileManager.mimeTypeCache.clear();
					break;
				case 'ips':
					client.userActivityManager.ipCache.clear();
					break;
				case 'userAgents':
					client.userActivityManager.userAgentCache.clear();
					break;
			}

			return res.json({ success: `Successfully reset cache: ${result.data}.` });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, `Failed to reset cache: ${result.data}.`);
		}
	};
};

// Endpoint: GET /api/admin/cache/stats
export const getCachedStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const getStats = (cache: {size: number; max: number; ttl: number; }) => ({
				size: cache.size, max: cache.max, ttl: cache.ttl,
			});

			res.json({
				files: getStats(client.FileManager.cache),
				mimeTypes: getStats(client.FileManager.mimeTypeCache),
				users: getStats(client.userManager.cache),
				userHistory: getStats(client.recentlyViewedFileManager.cache),
				sessions: getStats(client.sessionManager.cache),
				ips: getStats(client.userActivityManager.ipCache),
				userAgents: getStats(client.userActivityManager.userAgentCache),
			});
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get cached stats.');
		}
	};
};