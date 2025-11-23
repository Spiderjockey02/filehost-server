import type { Request, Response } from 'express';
import type Client from '@/helpers/Client';
import { Error } from '@/utils';

// Endpoint: DELETE /api/admin/cache/:name
export const deleteCacheByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		const name = req.params.name;

		try {
			switch (name) {
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
				default:
					return Error.IncorrectQuery(res, 'name must be one of users, files, history, sessions, mimetype, ips or userAgents.');
			}
			res.json({ success: `Successfully reset cache: ${name}.` });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, `Failed to reset cache: ${name}.`);
		}
	};
};

// Endpoint: GET /api/admin/cache/stats
export const getCachedStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const fileStats = {
				size: client.FileManager.cache.size,
				max: client.FileManager.cache.max,
				ttl: client.FileManager.cache.ttl,
			};

			const mimeTypeStats = {
				size: client.FileManager.mimeTypeCache.size,
				max: client.FileManager.mimeTypeCache.max,
				ttl: client.FileManager.mimeTypeCache.ttl,
			};

			const userStats = {
				size: client.userManager.cache.size,
				max: client.userManager.cache.max,
				ttl: client.userManager.cache.ttl,
			};

			const userHistoryStats = {
				size: client.recentlyViewedFileManager.cache.size,
				max: client.recentlyViewedFileManager.cache.max,
				ttl: client.recentlyViewedFileManager.cache.ttl,
			};

			const sessionStats = {
				size: client.sessionManager.cache.size,
				max: client.sessionManager.cache.max,
				ttl: client.sessionManager.cache.ttl,
			};

			const ipStats = {
				size: client.userActivityManager.ipCache.size,
				max: client.userActivityManager.ipCache.max,
				ttl: client.userActivityManager.ipCache.ttl,
			};

			const userAgentStats = {
				size: client.userActivityManager.userAgentCache.size,
				max: client.userActivityManager.userAgentCache.max,
				ttl: client.userActivityManager.userAgentCache.ttl,
			};

			res.json({ files: fileStats, mimeTypes: mimeTypeStats, users: userStats, userHistory: userHistoryStats, sessions: sessionStats, ips: ipStats, userAgents: userAgentStats });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get cached stats.');
		}
	};
};