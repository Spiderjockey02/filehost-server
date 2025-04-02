import { Error, sanitiseObject } from '../utils';
import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import os from 'os';

type data = { [key: string]: boolean}

// Endpoint: GET /api/admin/stats
export const getStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const diskData = client.FileManager.getFileSystemStatitics();

			res.json({
				storage: {
					totalFiles: 0,
					total: diskData.total,
					free: diskData.free,
				},
				memory: {
					total: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
					free:  Number((os.totalmem() / 1024 / 1024).toFixed(2)),
				},
				cpu: {
					total: 0,
					avg: os.loadavg(),
				},
				users: {
					total: await client.userManager.fetchTotal(),
					groups: (await client.groupManager.fetchAll()).map(g => ({
						name: g.name,
						userCount: g._count?.users ?? 0,
					})),
				},
			});
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch system statistics.');
		}
	};
};

// Endpoint: GET /api/admin/users
export const getUsers = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const filters = (req.query.filters as string).split(',');
			const parsedFilters: data = {};

			// Parse the filters and validate them
			if (Array.isArray(filters)) {
				for (const filter of filters) {
					if (['group', 'recent', 'delete', 'analyse'].includes(filter)) parsedFilters[filter] = true;
				}
			}

			// Fetch the database
			const users = await client.userManager.fetchAll(parsedFilters);
			res.json({ users: sanitiseObject(users) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of users.');
		}
	};
};