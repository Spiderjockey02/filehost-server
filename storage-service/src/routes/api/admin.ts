import { Router } from 'express';
import { fetchAllUsers } from '../../db/User';
import { fetchAllGroups } from '../../db/Group';
import directoryTree, { getNumberOfFiles } from '../../utils/directory';
import { checkAdmin } from '../../utils/functions';
import { exec } from 'node:child_process';
import os from 'os';
import util from 'node:util';
const cmd = util.promisify(exec);
const router = Router();

type data = { [key: string]: boolean}

export default function() {
	router.get('/stats', checkAdmin, async (_req, res) => {

		const platform = process.platform;
		let diskData: Array<string> = [];
		if (platform == 'win32') {
			const { stdout } = await cmd('wmic logicaldisk get size,freespace,caption');
			const parsed = stdout.trim().split('\n').slice(1).map(line => line.trim().split(/\s+(?=[\d/])/));
			const filtered = parsed.filter(d => process.cwd().toUpperCase().startsWith(d[0].toUpperCase()));
			diskData = filtered[0];
		} else if (platform == 'linux') {
			const { stdout } = await cmd('df -Pk --');
			const parsed = stdout.trim().split('\n').slice(1).map(line => line.trim().split(/\s+(?=[\d/])/));
			const filtered = parsed.filter(d => process.cwd().toUpperCase().startsWith(d[0].toUpperCase()));
			diskData = filtered[0];
		}

		res.json({
			storage: {
				totalFiles: getNumberOfFiles(directoryTree(process.cwd()), 0),
				total: Number(diskData[2] ?? 0),
				free: Number(diskData[1] ?? 0),
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
