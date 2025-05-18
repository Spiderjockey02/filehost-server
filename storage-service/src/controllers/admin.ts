import { fetchFileMediaTypes } from '../accessors/FileMimeType';
import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import { Error } from '../utils';
import os from 'os';

// Endpoint: GET /api/admin/stats
export const getStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const diskData = client.FileManager.getFileSystemStatistics();
			const { files } = await client.FileManager.fetchTotal();

			res.json({
				storage: {
					totalFiles: files,
					total: diskData.total,
					free: diskData.free,
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

// Endpoint: GET /api/admin/mimetypes
export const getMimeTypes = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { grouped } = req.query;
			if (grouped && typeof grouped !== 'string') return Error.IncorrectQuery(res, 'grouped must be a string.');
			if (grouped && !['true', 'false'].includes(grouped)) return Error.IncorrectQuery(res, 'grouped must be either true or false.');

			const mimeTypes = await fetchFileMediaTypes(grouped === 'true');
			res.json({ mimeTypes });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};

// Endpoint GET /api/admin/cron-jobs
export const getCronJobs = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const cronJobs = await client.CRONManager.fetchAllCronJobs();
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


			const logs = await client.CRONManager.fetchAllCronJobLogs();
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
				default:
					Error.MissingResource(res, `${name} is not a valid CRON job.`);
			}
			res.json({ success: 'Successfully ran CRON job.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};