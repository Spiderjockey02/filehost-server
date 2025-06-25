import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import { Error, PATHS } from '../utils';
import os from 'os';
import fs from 'fs/promises';

// Endpoint: GET /api/admin/stats
export const getStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const mediums = client.FileManager.getFileSystemStatistics();
			const { files } = await client.FileManager.fetchTotal();

			res.json({
				storage: {
					totalFiles: files,
					mediums,
				},
				memory: {
					using: Number((process.memoryUsage().heapUsed).toFixed(2)),
					total:  Number((os.totalmem()).toFixed(2)),
				},
				cpu: {
					total: 0,
					avg: os.loadavg(),
				},
				users: await client.userManager.fetchTotal(),
				uptime: process.uptime(),
			});
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch system statistics.');
		}
	};
};

// Endpoint GET /api/admin/cron-jobs
export const getCronJobs = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const cronJobs = await client.CRONManager.fetchAll();
			res.json({ cronJobs });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};

// Endpoint GET /api/admin/cron-jobs/:name/logs
export const getCronJobsByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		const name = req.params.name;
		try {
			const names = [...client.CRONManager.names.keys()];
			if (!names.includes(name)) return Error.MissingResource(res, `${name} is not a valid CRON job.`);

			const logs = await client.CRONManager.fetchAllLogs();
			res.json({ logs: logs.filter(l => l.jobName == name) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};

// Endpoint POST /api/admin/cron-jobs/:name
export const postCronJobsByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		const name = req.params.name;
		try {
			switch (name) {
				case 'BACKED_UP_DATABASE':
					await client.CRONManager.backupDatabase();
					break;
				case 'DELETE_EXPIRED_SESSIONS':
					await client.CRONManager.deleteExpiredSessions();
					break;
				case 'DELETE_OLD_LOG_FILES':
					await client.CRONManager.deleteOldLogFiles();
					break;
				case 'RECALCULATE_USER_STORAGE':
					await client.CRONManager.recalculateUserStorage();
					break;
				default:
					return Error.MissingResource(res, `${name} is not a valid CRON job.`);
			}
			res.json({ success: 'Successfully ran CRON job.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};

// Endpoint: GET /api/admin/system/stats
export const getSystemStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		// Fetch all logs and total byte size
		const logs = await fs.readdir(`${process.cwd()}/src/utils/logs`);
		const stats = await Promise.all(logs.map(path => fs.stat(`${process.cwd()}/src/utils/logs/${path}`)));
		const totalLogSize = stats.reduce((acc, stat) => acc + stat.size, 0);

		const files = await fs.readdir(PATHS.DATABASE_BACKUPS);
		const latestBackup = files.filter(a => a.endsWith('.json')).sort((a, b) => b.localeCompare(a))[0];
		const backup = await fs.readFile(`${PATHS.DATABASE_BACKUPS}/${latestBackup}`, 'utf-8');

		const lastSevenDays = await client.userActivityManager.calculateTransferBetweenTwoDates(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), new Date());

		res.json({
			memory: {
				using: Number((process.memoryUsage().heapUsed).toFixed(2)),
				total:  Number((os.totalmem()).toFixed(2)),
			},
			uptime: process.uptime(),
			logs: {
				totalByteSize: totalLogSize,
				count: logs.length,
			},
			network: (lastSevenDays?.incomingBytes ?? 0) + (lastSevenDays?.outgoingBytes ?? 0),
			backup: JSON.parse(backup),
		});
	};
};

// Endpoint: POST /api/admin/notification
export const postNotification = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { text, title, url, userId } = req.body;

		try {
			const user = await client.userManager.fetchbyParam({ id: userId });
			if (user == null) return Error.IncorrectQuery(res, 'UserId is not a valid user.');

			const notification = await client.notificationManager.create({ text, title, url, userId });
			res.json({ success: 'Notification created successfully.', notification });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to create / send new notification.');
		}
	};
};