// For upload, delete, move etc endpoints
import { Router } from 'express';
import { fetchAllUsers } from '../../db/User';
import { fetchAllGroups } from '../../db/Group';
import directoryTree, { getNumberOfFiles } from '../../utils/directory';
import { checkAdmin } from '../../utils/functions';
import { exec } from 'node:child_process';
import os from 'os';
const router = Router();

type data = { [key: string]: boolean}

export default function() {

	router.get('/stats', checkAdmin, async (_req, res) => {
		exec('wmic logicaldisk get size,freespace,caption', async function(_error, stdout) {
			// Get and parse storage information
			const parsed = stdout.trim().split('\n').slice(1).map(line => line.trim().split(/\s+(?=[\d/])/));
			const filtered = parsed.filter(d => process.cwd().toUpperCase().startsWith(d[0].toUpperCase()));
			const diskData = filtered[0];

			// Send data back to user
			res.json({
				storage: {
					totalFiles: getNumberOfFiles(directoryTree(process.cwd()), 0),
					total: Number(diskData[2]),
					free: Number(diskData[1]),
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
					total: (await fetchAllUsers()).length,
					groups: (await fetchAllGroups()).map(g => ({
						name: g.name,
						userCount: g._count.users,
					})),
				},
			});
		});
	});

	router.get('/users', checkAdmin, async (req, res) => {
		const filters = (req.query.filters as string).split(',');
		const parsedFilters: data = {};

		// Parse the filters and validate them
		if (Array.isArray(filters)) {
			for (const filter of filters) {
				if (['group', 'recent', 'delete', 'analyse'].includes(filter)) parsedFilters[filter] = true;
			}
		}

		// Fetch the database
		const users = await fetchAllUsers(parsedFilters);
		res.json({ users });
	});

	return router;
}
