import { validateAdminLogs, validateInterval, validateLogListener, validateString } from '@/validators';
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
			const result = validateAdminLogs.safeParse(req.query);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const { logs, total } = await client.AuditLogManager.fetchAll(result.data);
			return res.json({ logs, total });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch logs.');
		}
	};
};

// Endpoint: GET /api/admin/logs/types
export const getLogTypes = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [resourceTypes, successRates] = await Promise.all([
				client.AuditLogManager.fetchCountByResourceType(),
				client.AuditLogManager.fetchSuccessRate(),
			]);

			res.json({ resourceTypes, successRates });
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
		const result = validateInterval.safeParse(req.query['interval']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		const data: EntityCountMap = {};
		switch (result.data) {
			case 'yearly': {
				const currentYear = new Date().getFullYear();
				const startingValue = await client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates(new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1));

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const nextValue = await client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates(start, end);

					const cumulativeTotal = {
						user: startingValue.USER + nextValue.USER,
						file: startingValue.FILE + nextValue.FILE,
						storage: startingValue.STORAGE + nextValue.STORAGE,
						system: startingValue.SYSTEM + nextValue.SYSTEM,
						session: startingValue.SESSION + nextValue.SESSION,
					};
					data[currentYear - i] = cumulativeTotal;
				}

				return res.json({ data });
			}
			case 'monthly': {
				const current = new Date();
				current.setDate(1);

				const firstMonthDate = new Date();
				firstMonthDate.setMonth(current.getMonth() - 11);

				const startingValue = await client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates(new Date(2023, 0, 1), new Date(firstMonthDate));
				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const nextValue = await client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates(start, end);
					const cumulativeTotal = {
						user: startingValue.USER + nextValue.USER,
						file: startingValue.FILE + nextValue.FILE,
						storage: startingValue.STORAGE + nextValue.STORAGE,
						system: startingValue.SYSTEM + nextValue.SYSTEM,
						session: startingValue.SESSION + nextValue.SESSION,
					};
					data[monthName] = cumulativeTotal;
				}

			 return res.json({ data });
			}
			case 'daily': {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const frameStart = new Date(today);
				frameStart.setDate(today.getDate() - 14);

				const startingValue = await client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates(new Date(2023, 0, 1), frameStart);
				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0]!;
					const nextValue = await client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates(start, end);
					const cumulativeTotal = {
						user: startingValue.USER + nextValue.USER,
						file: startingValue.FILE + nextValue.FILE,
						storage: startingValue.STORAGE + nextValue.STORAGE,
						system: startingValue.SYSTEM + nextValue.SYSTEM,
						session: startingValue.SESSION + nextValue.SESSION,
					};
					data[dateStr] = cumulativeTotal;
				}
				return res.json({ data });
			}
			case 'hourly': {
				const now = new Date();
				const frameStart = new Date(now);
				frameStart.setHours(now.getHours() - 23, 0, 0, 0);
				const startingValue = await client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates(new Date(2023, 0, 1), frameStart);

				for (let i = 0; i < 24; i++) {
					const start = new Date(frameStart);
					start.setHours(frameStart.getHours() + i);
					const end = new Date(start);
					end.setHours(start.getHours() + 1);

					const dateStr = `${start.getHours().toString().padStart(2, '0')}:00`;
					const nextValue = await client.AuditLogManager.fetchActivityByResourceTypeBetweenTwoDates(start, end);

					const cumulativeTotal = {
						user: startingValue.USER + nextValue.USER,
						file: startingValue.FILE + nextValue.FILE,
						storage: startingValue.STORAGE + nextValue.STORAGE,
						system: startingValue.SYSTEM + nextValue.SYSTEM,
						session: startingValue.SESSION + nextValue.SESSION,
					};
					data[dateStr] = cumulativeTotal;
				}

				return res.json({ data });
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
			const result = validateLogListener.safeParse(req.body);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const listener = await client.AuditLogManager.addListener({ userId: session!.userId, ...result.data, eventNames: result.data.events });
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: 'Successfully created audit log listener.',
					resourceId: listener.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					success: true,
				});
			});
			return res.json({ success: 'Successfully created log listener.', listener });
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
			return Error.GenericError(res, 'Failed to create log listener.');
		}
	};
};

// Endpoint: DELETE /api/admin/logs/listeners/:id
export const deleteLogListener = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);

		// Fetch and validate listener ID
		const result = validateString.safeParse(req.params['id']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			const listener = await client.AuditLogManager.removeListener(result.data);
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

			return res.json({ success: 'Successfully deleted log listener.' });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: `Failed to delete audit log listener due to error: ${err}.`,
					resourceId: result.data,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});

			return Error.GenericError(res, 'Failed to delete log listener.');
		}
	};
};

// Endpoint: PATCH /api/admin/logs/listeners/:id
export const patchLogListener = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);

		// Fetch and validate listener ID
		const result = validateString.safeParse(req.params['id']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			const bodyResult = validateLogListener.safeParse(req.body);
			if (!bodyResult.success) return Error.IncorrectQuery(res, bodyResult.error.issues);

			const listener = await client.AuditLogManager.updateListener({ id: result.data, userId: session!.userId, ...bodyResult.data, eventNames: bodyResult.data.events });
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

			return res.json({ success: 'Successfully created log listener.', listener });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SYSTEM',
					eventName: 'LISTENER_UPDATED',
					message: `Failed to update audit log listener due to error: ${err}.`,
					resourceId: result.data,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});

			return Error.GenericError(res, 'Failed to update log listener.');
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

			res.json({ logs: logs.reverse(), total: totalLogSize });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch log files.');
		}
	};
};

// Endpoint: GET /api/admin/logs/files/:date
export const getSpecificLog = (client: Client) => {
	return async (req: Request, res: Response) => {
		const result = validateString.safeParse(req.params['date']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			// Check if the file exists
			if (!existsSync(`${process.cwd()}/src/utils/logs/${result.data}`)) return Error.MissingResource(res);

			const log = await fs.readFile(`${process.cwd()}/src/utils/logs/${result.data}`, 'utf-8');
			const logs = log.split(/\r?\n/).filter(line => line.trim() !== '');
			return res.json({ logs: logs, total: logs.length });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch log file.');
		}
	};
};