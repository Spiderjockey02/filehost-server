import { validateAdminLogs, validateFrame, validateLogListener } from '@/validators';
import type { AuditLogEventName, ListenerType } from '@/types/generated/client';
import type { Request, Response } from 'express';
import type { EntityCountMap } from '@/types';
import type Client from '@/helpers/Client';
import { getSession } from '@/middleware';
import { Error, getIP } from '@/utils';
import { existsSync } from 'fs';
import fs from 'fs/promises';

// Endpoint: GET /api/admin/logs
export const getLogs = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { userId, page, eventName, sortOrder } = req.query;
			const result = validateAdminLogs.safeParse({ userId, page, eventName: eventName == '' ? undefined : eventName, sortOrder });
			if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

			const { logs, total } = await client.AuditLogManager.fetchAll({ ...result.data, eventName: result.data.eventName as AuditLogEventName });
			res.json({ logs, total });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch logs.');
		}
	};
};

// Endpoint: GET /api/admin/logs/types
export const getLogTypes = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const p = await Promise.all([
				client.AuditLogManager.fetchCountByResourceType('USER'),
				client.AuditLogManager.fetchCountByResourceType('FILE'),
				client.AuditLogManager.fetchCountByResourceType('STORAGE'),
				client.AuditLogManager.fetchCountByResourceType('SYSTEM'),
				client.AuditLogManager.fetchCountByResourceType('SESSION'),
				client.AuditLogManager.fetchSuccessRate(),
			]);
			res.json({ resourceTypes: { user: p[0], file: p[1], storage: p[2], system: p[3], session: p[4] }, successRates: p[5] });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch log types.');
		}
	};
};

// Endpoint: GET /api/admin/logs/history
export const getLogHistory = (client: Client) => {
	return async (req: Request, res: Response) => {
		// Get time frame and validate it
		const frame = req.query.frame;
		const result = validateFrame.safeParse(frame);
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		switch (frame) {
			case 'yearly': {
				const years: EntityCountMap = {};
				const currentYear = new Date().getFullYear();
				let cumulativeTotal = await Promise.all([
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('USER', new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1)),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('FILE', new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1)),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('STORAGE', new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1)),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SYSTEM', new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1)),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SESSION', new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1)),
				]) as number[];

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const users = await Promise.all([
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('USER', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('FILE', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('STORAGE', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SYSTEM', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SESSION', start, end),
					]);

					cumulativeTotal = Array.from({ length: 5 }, (_, j) => (users[j] ?? 0) + (cumulativeTotal[j] ?? 0));
					years[currentYear - i] = {
						user: cumulativeTotal[0],
						file: cumulativeTotal[1],
						storage: cumulativeTotal[2],
						system: cumulativeTotal[3],
						session: cumulativeTotal[4],
					};
				}
				res.json({ years });
				break;
			}
			case 'monthly': {
				const months: EntityCountMap = {};
				const current = new Date();
				current.setDate(1);

				const firstMonthDate = new Date();
				firstMonthDate.setMonth(current.getMonth() - 11);

				let cumulativeTotal = await Promise.all([
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('USER', new Date(2023, 0, 1), new Date(firstMonthDate)),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('FILE', new Date(2023, 0, 1), new Date(firstMonthDate)),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('STORAGE', new Date(2023, 0, 1), new Date(firstMonthDate)),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SYSTEM', new Date(2023, 0, 1), new Date(firstMonthDate)),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SESSION', new Date(2023, 0, 1), new Date(firstMonthDate)),
				]) as number[];

				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const users = await Promise.all([
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('USER', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('FILE', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('STORAGE', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SYSTEM', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SESSION', start, end),
					]);

					cumulativeTotal = Array.from({ length: 5 }, (_, j) => (users[j] ?? 0) + (cumulativeTotal[j] ?? 0));
					months[monthName] = {
						user: cumulativeTotal[0],
						file: cumulativeTotal[1],
						storage: cumulativeTotal[2],
						system: cumulativeTotal[3],
						session: cumulativeTotal[4],
					};
				}
				res.json({ months });
				break;
			}
			case 'daily': {
				const days: EntityCountMap = {};
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const frameStart = new Date(today);
				frameStart.setDate(today.getDate() - 14);

				let cumulativeTotal = await Promise.all([
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('USER', new Date(2023, 0, 1), frameStart),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('FILE', new Date(2023, 0, 1), frameStart),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('STORAGE', new Date(2023, 0, 1), frameStart),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SYSTEM', new Date(2023, 0, 1), frameStart),
					client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SESSION', new Date(2023, 0, 1), frameStart),
				]) as number[];

				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const users = await Promise.all([
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('USER', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('FILE', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('STORAGE', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SYSTEM', start, end),
						client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates('SESSION', start, end),
					]);

					cumulativeTotal = Array.from({ length: 5 }, (_, j) => (users[j] ?? 0) + (cumulativeTotal[j] ?? 0));
					days[dateStr] = {
						user: cumulativeTotal[0],
						file: cumulativeTotal[1],
						storage: cumulativeTotal[2],
						system: cumulativeTotal[3],
						session: cumulativeTotal[4],
					};
				}
				res.json({ days });
				break;
			}
		}
	};
};

// Endpoint: GET /api/admin/logs/events
export const getLogEvents = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const events = await client.AuditLogManager.fetchAllEvents();
			res.json({ events });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch log events.');
		}
	};
};

// Endpoint: GET /api/admin/logs/listeners
export const getLogListeners = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const listeners = await client.AuditLogManager.fetchAllListeners();
			res.json({ listeners });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch log listeners.');
		}
	};
};


// Endpoint: POST /api/admin/logs/listeners
export const postLogListener = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		try {
			const { type, events, name, targetUrl } = req.body;
			const result = validateLogListener.safeParse({ type, events, name, targetUrl });
			if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

			const listener = await client.AuditLogManager.addListener({ userId: session!.userId, type: type as ListenerType, eventNames: events, name, targetUrl });
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: 'Successfully created audit log listener.',
					resourceId: listener.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully created log listener.', listener });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: `Failed to create audit log listener due to error: ${err}.`,
					resourceId: '',
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			Error.GenericError(res, 'Failed to create log listener.');
		}
	};
};

// Endpoint: DELETE /api/admin/logs/listeners/:id
export const deleteLogListener = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);

		// Fetch and validate listener ID
		const { id } = req.params;
		if (typeof id !== 'string') return Error.IncorrectQuery(res, 'Listener ID is required.');
		try {
			const listener = await client.AuditLogManager.removeListener(id);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: 'Successfully deleted audit log listener.',
					resourceId: listener.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully deleted log listener.' });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: `Failed to delete audit log listener due to error: ${err}.`,
					resourceId: id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			Error.GenericError(res, 'Failed to delete log listener.');
		}
	};
};

// Endpoint: PATCH /api/admin/logs/listeners/:id
export const patchLogListener = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);

		// Fetch and validate listener ID
		const { id } = req.params;
		if (typeof id !== 'string') return Error.IncorrectQuery(res, 'Listener ID is required.');
		try {
			const { type, events, name, targetUrl, enabled } = req.body;
			const result = validateLogListener.safeParse({ type, events, name, targetUrl, enabled });
			if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

			const listener = await client.AuditLogManager.updateListener({ id, userId: session!.userId, type: type as ListenerType, eventNames: events, name, targetUrl, enabled });
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: 'Successfully updated audit log listener.',
					resourceId: listener.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully created log listener.', listener });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: `Failed to update audit log listener due to error: ${err}.`,
					resourceId: id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			Error.GenericError(res, 'Failed to update log listener.');
		}
	};
};


// Endpoint: GET /api/admin/logs/files
export const getLogFiles = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Fetch all logs and total byte size
			const logs = await fs.readdir(`${process.cwd()}/src/utils/logs`);
			const stats = await Promise.all(logs.map(path => fs.stat(`${process.cwd()}/src/utils/logs/${path}`)));
			const totalLogSize = stats.reduce((acc, stat) => acc + stat.size, 0);

			res.json({ logs: logs.reverse(), totalLogSize });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch log files.');
		}
	};
};

// Endpoint: GET /api/admin/logs/files/:date
export const getSpecificLog = (client: Client) => {
	return async (req: Request, res: Response) => {
		const date = req.params.date;

		try {
			// Check if the file exists
			if (!existsSync(`${process.cwd()}/src/utils/logs/${date}`)) return Error.IncorrectQuery(res, 'Log file does not exist.');

			const log = await fs.readFile(`${process.cwd()}/src/utils/logs/${date}`, 'utf-8');
			res.json({ logs: log.toString().split(/\r?\n/) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch log file.');
		}
	};
};