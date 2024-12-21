import { Request, Response } from 'express';
import { exec } from 'node:child_process';
import os from 'os';
import util from 'node:util';
import { fetchAllGroups } from '../accessors/Group';
import { directoryTree, getNumberOfFiles, Error } from '../utils';
import { Client } from 'src/helpers';
const cmd = util.promisify(exec);

type data = { [key: string]: boolean}
interface diskStorage {
  free: number
  total: number
}

// Endpoint: GET /api/admin/stats
export const getStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const platform = process.platform;
			let diskData: diskStorage = { free: 0, total: 0 };
			if (platform == 'win32') {
				const { stdout } = await cmd('wmic logicaldisk get size,freespace,caption');
				const parsed = stdout.trim().split('\n').slice(1).map(line => line.trim().split(/\s+(?=[\d/])/));
				const filtered = parsed.filter(d => process.cwd().toUpperCase().startsWith(d[0].toUpperCase()));
				diskData = {
					free: Number(filtered[0][1]),
					total: Number(filtered[0][2]),
				};
			} else if (platform == 'linux') {
				const { stdout } = await cmd('df -Pk --');
				const parsed = stdout.trim().split('\n').slice(1).map(line => line.trim().split(/\s+(?=[\d/])/));
				const filtered = parsed.filter(() => true);
				diskData = {
					free: Number(filtered[0][3]),
					total: Number(filtered[0][1]),
				};
			}

			res.json({
				storage: {
					totalFiles: getNumberOfFiles(await directoryTree(process.cwd()), 0),
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
					total: (await client.userManager.fetchAll()).length,
					groups: (await fetchAllGroups()).map(g => ({
						name: g.name,
						userCount: g._count.users,
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
			res.json({ users });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of users.');
		}
	};
};