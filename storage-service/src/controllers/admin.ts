import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import { Error, getIP, PATHS } from '../utils';
import os from 'os';
import fs from 'fs/promises';
import MIMEList from '../../assets/MIME-list.json';
import { CronJobLog } from '@prisma/client';
import { createAuditLogEntry } from '../accessors/AuditLog';
import { getSession } from '../middleware';

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

			if (!client.CRONManager.isValidCronJobName(cronJob)) return Error.MissingResource(res, `${cronJob} is not a valid CRON job.`);
			if (schedule == null) return Error.IncorrectQuery(res, 'Schedule is required.');
			if (typeof schedule !== 'string') return Error.IncorrectQuery(res, 'Schedule must be a string.');
			if (!schedule.match(/^[0-9\-\*\/, ]+$/)) return Error.IncorrectQuery(res, 'Schedule must be a valid CRON expression.');

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
				createAuditLogEntry({
					eventType: 'CRONJOB_RAN',
					resourceType: 'SYSTEM',
					resourceId: name,
					success: true,
					message: `CRON job ${name} executed successfully.`,
					userId: session.user?.id,
					userAgent: req.headers['user-agent'],
					ip: getIP(req),
				});
			});
			res.json({ success: 'Successfully ran CRON job.' });
		} catch (err) {
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				createAuditLogEntry({
					eventType: 'CRONJOB_RAN',
					resourceType: 'SYSTEM',
					resourceId: name,
					success: false,
					message: `CRON job ${name} failed with error: ${err}`,
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
		if (typeof text !== 'string' || text.length < 1) return Error.IncorrectQuery(res, 'text must be a string with at least 1 character.');
		if (typeof title !== 'string' || title.length < 1) return Error.IncorrectQuery(res, 'title must be a string with at least 1 character.');
		if (url != undefined && (typeof url !== 'string' || !url.startsWith('/'))) return Error.IncorrectQuery(res, 'url must be a string starting with /.');
		if (typeof userId !== 'string' || userId.length < 1) return Error.IncorrectQuery(res, 'userId must be a string with at least 1 character.');

		// Check session
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		const user = await client.userManager.fetchbyParam({ id: userId });
		if (user == null) return Error.IncorrectQuery(res, 'UserId is not a valid user.');
		try {

			const notification = await client.notificationManager.create({ text, title, url, userId: user.id });

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				createAuditLogEntry({
					eventType: 'NOTIFICATION_SENT',
					resourceType: 'USER',
					resourceId: notification.id,
					success: true,
					userId: session.user.id,
				});
			});
			res.json({ success: 'Notification created successfully.', notification });
		} catch (err) {
			client.logger.error(err);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				createAuditLogEntry({
					eventType: 'NOTIFICATION_SENT',
					resourceType: 'USER',
					resourceId: user.id,
					success: false,
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
			KEEP_ORIGINAL_METADATA, THUMBNAIL, RETENTION_POLICY_IN_DAYS, FOLDER_SIZE } = req.body;

		// Validate MAX_AVATAR_SIZE and MAX_CHARS_FILE_NAME are positive integers
		if (typeof MAX_AVATAR_SIZE !== 'number' || isNaN(MAX_AVATAR_SIZE) || MAX_AVATAR_SIZE < 1) return Error.IncorrectQuery(res, 'MAX_AVATAR_SIZE must be a valid number greater than or equal to 1.');
		if (typeof MAX_CHARS_FILE_NAME !== 'number' || isNaN(MAX_CHARS_FILE_NAME) || MAX_CHARS_FILE_NAME < 1) return Error.IncorrectQuery(res, 'MAX_CHARS_FILE_NAME must be a valid number greater than or equal to 1.');

		// Validate DISALLOWED_MIME_TYPES is an array of valid mime types
		if (!Array.isArray(DISALLOWED_MIME_TYPES)) return Error.IncorrectQuery(res, 'DISALLOWED_MIME_TYPES must be an array of strings.');
		for (const mimeType of DISALLOWED_MIME_TYPES) {
			if (typeof mimeType !== 'string') return Error.IncorrectQuery(res, 'DISALLOWED_MIME_TYPES must be an array of strings.');
			if (!MIMEList.includes(mimeType)) return Error.IncorrectQuery(res, `${mimeType} is not a valid mime type.`);
		}

		// Validate INVALID_CHARS_IN_FILE_NAME is an array of strings
		if (!Array.isArray(INVALID_CHARS_IN_FILE_NAME)) return Error.IncorrectQuery(res, 'INVALID_CHARS_IN_FILE_NAME must be an array of strings.');
		for (const char of INVALID_CHARS_IN_FILE_NAME) {
			if (typeof char !== 'string') return Error.IncorrectQuery(res, 'INVALID_CHARS_IN_FILE_NAME must be an array of strings.');
		}

		// Validate KEEP_ORIGINAL_METADATA is a boolean
		if (typeof KEEP_ORIGINAL_METADATA !== 'boolean') return Error.IncorrectQuery(res, 'KEEP_ORIGINAL_METADATA must be a boolean.');

		// Validate THUMBNAIL is an object with WIDTH and HEIGHT as positive integers
		if (typeof THUMBNAIL !== 'object' || THUMBNAIL == null) return Error.IncorrectQuery(res, 'THUMBNAIL must be an object.');
		const { WIDTH, HEIGHT } = THUMBNAIL;
		if (typeof WIDTH !== 'number' || isNaN(WIDTH) || WIDTH < 1) return Error.IncorrectQuery(res, 'THUMBNAIL.WIDTH must be a valid number greater than or equal to 1.');
		if (typeof HEIGHT !== 'number' || isNaN(HEIGHT) || HEIGHT < 1) return Error.IncorrectQuery(res, 'THUMBNAIL.HEIGHT must be a valid number greater than or equal to 1.');

		// Validate RETENTION_POLICY_IN_DAYS is an object with LOG_FILES, DATABASE_FILES, USER_ACTIVITY, AUDIT_LOGS as non-negative integers
		if (typeof RETENTION_POLICY_IN_DAYS !== 'object' || RETENTION_POLICY_IN_DAYS == null) return Error.IncorrectQuery(res, 'RETENTION_POLICY_IN_DAYS must be an object.');
		const { LOG_FILES, DATABASE_FILES, USER_ACTIVITY, AUDIT_LOGS } = RETENTION_POLICY_IN_DAYS;
		if (typeof LOG_FILES !== 'number' || isNaN(LOG_FILES) || LOG_FILES < 0) return Error.IncorrectQuery(res, 'RETENTION_POLICY_IN_DAYS.LOG_FILES must be a valid number greater than or equal to 0.');
		if (typeof DATABASE_FILES !== 'number' || isNaN(DATABASE_FILES) || DATABASE_FILES < 0) return Error.IncorrectQuery(res, 'RETENTION_POLICY_IN_DAYS.DATABASE_FILES must be a valid number greater than or equal to 0.');
		if (typeof USER_ACTIVITY !== 'number' || isNaN(USER_ACTIVITY) || USER_ACTIVITY < 0) return Error.IncorrectQuery(res, 'RETENTION_POLICY_IN_DAYS.USER_ACTIVITY must be a valid number greater than or equal to 0.');
		if (typeof AUDIT_LOGS !== 'number' || isNaN(AUDIT_LOGS) || AUDIT_LOGS < 0) return Error.IncorrectQuery(res, 'RETENTION_POLICY_IN_DAYS.AUDIT_LOGS must be a valid number greater than or equal to 0.');

		// Validate FOLDER_SIZE is a positive integer
		if (typeof FOLDER_SIZE !== 'number' || isNaN(FOLDER_SIZE) || FOLDER_SIZE < 1) return Error.IncorrectQuery(res, 'FOLDER_SIZE must be a valid number greater than or equal to 1.');

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