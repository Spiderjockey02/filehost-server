import { validateConfig, validateCRONSchedule, validateNotification } from '@/validators';
import type { CronJobLog } from '@/types/generated/client';
import MIMEList from '../../assets/MIME-list.json';
import type { Request, Response } from 'express';
import { Error, getIP, PATHS } from '@/utils';
import type Client from '@/helpers/Client';
import { getSession } from '@/middleware';
import fs from 'fs/promises';
import os from 'os';

// Endpoint: GET /api/admin/stats
export const getStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const mediums = await client.FileManager.getFileSystemStatistics();
			const { files } = await client.FileManager.fetchTotal();

			res.json({
				storage: {
					totalFiles: files,
					mediums,
				},
				memory: {
					using: Number(process.memoryUsage().heapUsed.toFixed(2)),
					total:  Number(os.totalmem().toFixed(2)),
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
			if (!client.CRONManager.isValidCronJobName(name)) return Error.MissingResource(res, `${name} is not a valid CRON job.`);
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
		try {
			const cronJob = req.params.name;
			const { schedule } = req.body;

			// Validate cronJob name and schedule (CRON format)
			if (!client.CRONManager.isValidCronJobName(cronJob)) return Error.MissingResource(res, `${cronJob} is not a valid CRON job.`);
			const result = validateCRONSchedule.safeParse(schedule);
			if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

			client.CRONManager.updateAndReschedule(cronJob, req.body.schedule);
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to update CRON job.');

		}
	};
};


// Endpoint POST /api/admin/cron-jobs/:name/run
export const postCronJobsByNameRun = (client: Client) => {
	return async (req: Request, res: Response) => {
		const name = req.params.name;
		let log: CronJobLog;
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);
		try {
			switch (name) {
				case 'BACKED_UP_DATABASE':
					log = await client.CRONManager.backupDatabase();
					break;
				case 'DELETE_EXPIRED_SESSIONS':
					log = await client.CRONManager.deleteExpiredSessions();
					break;
				case 'DELETE_OLD_LOG_FILES':
					log = await client.CRONManager.deleteOldLogFiles();
					break;
				case 'RECALCULATE_USER_STORAGE':
					log = await client.CRONManager.recalculateUserStorage();
					break;
				case 'RECALCULATE_STORAGE_USAGE':
					log = await client.CRONManager.recalculateStorageUsage();
					break;
				case 'DELETE_OLD_BACKUPS':
					log = await client.CRONManager.deleteOldBackups();
					break;
				default:
					return Error.MissingResource(res, `${name} is not a valid CRON job.`);
			}

			if (log.status == 'FAILURE') throw log.message ?? 'CRON job failed to execute.';
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					eventName: 'CRONJOB_RAN',
					resourceType: 'SYSTEM',
					resourceId: name,
					success: true,
					message: 'Successfully ran CRON job.',
					userId: session.user?.id,
					userAgent: req.headers['user-agent'],
					ip: getIP(req),
				});
			});
			res.json({ success: 'Successfully ran CRON job.' });
		} catch (err) {
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					eventName: 'CRONJOB_RAN',
					resourceType: 'SYSTEM',
					resourceId: name,
					success: false,
					message: `Failed to run CRON job due to error: ${err}.`,
					userId: session.user?.id,
					userAgent: req.headers['user-agent'],
					ip: getIP(req),
				});
			});

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
		// Validate body
		const { text, title, url, userId } = req.body;
		const result = validateNotification.safeParse({ text, title, url, userId });
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		// Check session
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		// Check recipient is a valid user
		const user = await client.userManager.fetchbyParam({ id: userId });
		if (user == null) return Error.IncorrectQuery(res, 'UserId is not a valid user.');

		try {
			const notification = await client.notificationManager.create({ text, title, url, userId: user.id });

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
		const { MAX_AVATAR_SIZE, MAX_CHARS_FILE_NAME, DISALLOWED_MIME_TYPES, INVALID_CHARS_IN_FILE_NAME,
			KEEP_ORIGINAL_METADATA, THUMBNAIL, RETENTION_POLICY_IN_DAYS, FOLDER_SIZE, RATE_LIMIT } = req.body;

		const result = validateConfig.safeParse({ MAX_AVATAR_SIZE, MAX_CHARS_FILE_NAME, DISALLOWED_MIME_TYPES, INVALID_CHARS_IN_FILE_NAME,
			KEEP_ORIGINAL_METADATA, THUMBNAIL, RETENTION_POLICY_IN_DAYS, FOLDER_SIZE, RATE_LIMIT });
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		client.config.setAll(req.body);
		res.json({ success: 'Configuration updated successfully.' });
	};
};


// Endpoint: GET /api/admin/mime-types/search
export const getMimeTypesSearch = () => {
	return async (req: Request, res: Response) => {
		const { query } = req.query;
		if (typeof query !== 'string') return Error.IncorrectQuery(res, 'query must be type string.');

		const list = MIMEList.filter((a) => a.startsWith(query)).sort((a, b) => a.localeCompare(b)).slice(0, 9);
		res.json({ list });
	};
};