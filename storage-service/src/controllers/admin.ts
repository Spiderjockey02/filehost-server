import { validateCronJobName, validateCRONSchedule } from '@/validators/admin';
import { validateConfig, validateNotification } from '@/validators';
import { getCPU, getMemory } from '@/helpers/SystemManager';
import MetadataExtractor from '@/media/MetadataExtractor';
import type { Request, Response } from 'express';
import type Client from '@/helpers/Client';
import { DatabaseMetadata } from '@/types';
import { getSession } from '@/middleware';
import dbClient from '@/accessors';
import { Error } from '@/utils';
import fs from 'fs/promises';
import os from 'os';

// Endpoint: GET /api/admin/stats
export const getStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [mediums, { files }, users, cpu] = await Promise.all([
				client.FileManager.getFileSystemStatistics(),
				client.FileManager.fetchTotal(),
				client.userManager.fetchTotal(),
				getCPU(),
			]);

			res.json({
				storage: {
					totalFiles: files,
					mediums: mediums,
				},
				cpu,
				memory: getMemory(),
				users,
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
		// Validate params
		const result = validateCronJobName.safeParse(req.params);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			const logs = await client.CRONManager.fetchAllLogs(result.data.name);
			return res.json({ logs });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};

// Endpoint POST /api/admin/cron-jobs/:name
export const postCronJobsByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			// Validate params
			const resultCronJobName = validateCronJobName.safeParse(req.params);
			if (!resultCronJobName.success) return Error.IncorrectQuery(res, resultCronJobName.error.issues);

			// Validate cronJob name and schedule (CRON format)
			const result = validateCRONSchedule.safeParse(req.body);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			await client.CRONManager.updateAndReschedule(resultCronJobName.data.name, result.data.schedule);
			res.json({ success: `Successfully updated CRON Job: ${resultCronJobName.data.name}` });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to update CRON job.');
		}
	};
};


// Endpoint POST /api/admin/cron-jobs/:name/run
export const postCronJobsByNameRun = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		// Validate params
		const result = validateCronJobName.safeParse(req.params);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			await client.CRONManager.runCRONJobManually(result.data.name, session.user, req);
			res.json({ success: `Successfully ran CRON Job manually: ${result.data.name}.` });
		} catch (err) {
			client.logger.error(`Failed to fetch system statistics: ${err}`);
			return Error.GenericError(res, 'Failed to run CRON job manually.');
		}
	};
};

// Endpoint: GET /api/admin/system/stats
export const getSystemStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Fetch log information
			const logsPath = `${process.cwd()}/src/utils/logs`;
			let logFiles: string[] = [];
			try {
				logFiles = await fs.readdir(logsPath);
			} catch {
				logFiles = [];
			}

			const logStats = await Promise.all(logFiles.map(async (file) => {
				try {
					const stat = await fs.stat(`${logsPath}/${file}`);
					return stat.isFile() ? stat.size : 0;
				} catch {
					return 0;
				}
			}));
			const totalLogSize = logStats.reduce((total, size) => total + size, 0);

			// Fetch latest database backup
			let backup: DatabaseMetadata | null = null;

			try {
				const backups = await dbClient.$getBackups();
				backup = backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
			} catch (err) {
				client.logger.error(`Failed to retrieve database backups: ${err}`);
				backup = null;
			}

			// Last 7 days of network transfer
			const now = new Date();
			const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const lastSevenDays = await client.userActivityManager.calculateTransferBetweenTwoDates(sevenDaysAgo, now);

			return res.json({
				memory: {
					using: process.memoryUsage().heapUsed,
					total: os.totalmem(),
				},
				uptime: process.uptime(),
				logs: {
					totalByteSize: totalLogSize,
					count: logFiles.length,
				},
				network: (lastSevenDays?.incomingBytes ?? 0) + (lastSevenDays?.outgoingBytes ?? 0),
				backup,
			});
		} catch (err) {
			client.logger.error(err);
			console.error('Failed to fetch system statistics:', err);
			return Error.GenericError(res, 'Failed to retrieve system statistics');
		}
	};
};

// Endpoint: POST /api/admin/notification
export const postNotification = (client: Client) => {
	return async (req: Request, res: Response) => {
		// Validate body
		const result = validateNotification.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		// Check session
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		// Check recipient is a valid user
		const user = await client.userManager.fetchbyParam({ id: result.data.userId });
		if (user == null) return Error.IncorrectQuery(res, [{ message: 'UserId is not a valid user.' }]);

		try {
			const notification = await client.notificationManager.create(result.data);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					eventName: 'NOTIFICATION_SENT',
					resourceType: 'USER',
					resourceId: notification.id,
					success: true,
					message: `Admin: ${session.user.id} successfully sent notification to user: ${user.id}.`,
					userId: session.user.id,
				});
			});
			res.json({ success: 'Notification created successfully.', notification });
		} catch (err) {
			client.logger.error(err);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					eventName: 'NOTIFICATION_SENT',
					resourceType: 'USER',
					resourceId: user.id,
					success: false,
					message: `Admin: ${session.user.id} failed to sent notification to user: ${user.id} due to error: ${err}.`,
					userId: session.user.id,
				});
			});
			Error.GenericError(res, 'Failed to create / send new notification.');
		}
	};
};

// Endpoint: GET /api/admin/config
export const getConfig = (client: Client) => {
	return async (_req: Request, res: Response) => {
		res.json(client.config.getAll());
	};
};

// Endpoint: POST /api/admin/config
export const postConfig = (client: Client) => {
	return async (req: Request, res: Response) => {
		// Check session
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		const result = validateConfig.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		// Log audit
		client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
			await client.AuditLogManager.create({
				eventName: 'CONFIG_UPDATED',
				resourceType: 'USER',
				resourceId: '',
				success: true,
				message: 'Updated config',
				userId: session.user.id,
			});
		});

		client.config.setAll(result.data);
		res.json({ success: 'Configuration updated successfully.' });
	};
};


// Endpoint: GET /api/admin/mime-types/search
export const getMimeTypesSearch = () => {
	return async (req: Request, res: Response) => {
		const { query } = req.query;
		if (typeof query !== 'string') return Error.IncorrectQuery(res, [{ message: 'query must be type string.' }]);

		const list = new MetadataExtractor().getMimeTypes().filter((a) => a.startsWith(query)).sort((a, b) => a.localeCompare(b)).slice(0, 9);
		return res.json({ list });
	};
};