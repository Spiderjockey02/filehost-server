// For upload, delete, move etc endpoints
import { Router } from 'express';
import { getUsers } from '../../db/User';
import { getGroupsWithCount } from '../../db/Group';
import directoryTree, { getNumberOfFiles } from '../../utils/directory';
import { exec } from 'node:child_process';
import os from 'os';
const router = Router();

export default function() {

	router.get('/stats', async (_req, res) => {
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
					total: (await getUsers()).length,
					groups: (await getGroupsWithCount()).map(g => ({
						name: g.name,
						userCount: g._count.user,
					})),
				},
			});
		});
	});


	router.get('/user', (req, res) => {

	});
	return router;
}
