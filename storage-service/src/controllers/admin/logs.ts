import type { Request, Response } from 'express';
import { Error } from '../../utils';
import fs from 'fs/promises';
import Client from 'src/helpers/Client';
import { existsSync } from 'fs';
import { getSession } from '../../middleware';
import { AuditLogEventName, ListenerType, Prisma } from '@prisma/client';
type countEnum = { [key: string | number]: {
	user: number
	file: number
	storage: number
	system: number
	session: number
} }

// Endpoint: GET /api/admin/logs
export const getLogs = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { userId, page, eventName, sortOrder } = req.query;

			if (userId && typeof userId !== 'string') return Error.IncorrectQuery(res, 'Invalid userId provided.');
			if (page && (typeof page !== 'string' || !/^\d+$/.test(page) || Number(page) < 0)) return Error.IncorrectQuery(res, 'page must be a positive number.');
			if (eventName && (typeof eventName !== 'string' || !Object.keys(AuditLogEventName).includes(eventName))) return Error.IncorrectQuery(res, 'eventName is invalid');
			if (sortOrder && (typeof sortOrder !== 'string' || !['desc', 'asc'].includes(sortOrder))) return Error.IncorrectQuery(res, 'sortOrder is invalid');

			const { logs, total } = await client.AuditLogManager.fetch({ userId, page: isNaN(Number(page)) ? undefined : Number(page), eventName: eventName as AuditLogEventName, sortOrder: sortOrder as Prisma.SortOrder });
			res.json({ logs, total });
		} catch (error) {
			client.logger.error(error);
			Error.GenericError(res, 'Failed to fetch logs.');
		}
	};
};

// Endpoint: GET /api/admin/logs/types
export const getLogTypes = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const p = await Promise.all([
				client.AuditLogManager.getCountByResourceType('USER'),
				client.AuditLogManager.getCountByResourceType('FILE'),
				client.AuditLogManager.getCountByResourceType('STORAGE'),
				client.AuditLogManager.getCountByResourceType('SYSTEM'),
				client.AuditLogManager.getCountByResourceType('SESSION'),
			]);
			res.json({ resourceTypes: { user: p[0], file: p[1], storage: p[2], system: p[3], session: p[4] } });
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
		if (!frame || typeof frame !== 'string' || !['yearly', 'monthly', 'daily'].includes(frame)) return Error.IncorrectQuery(res, `frame must be on one of the following: ${['yearly', 'monthly', 'daily'].join(', ')}`);

		switch (frame) {
			case 'yearly': {
				const years: countEnum = {};
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
				const months: countEnum = {};
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
				const days: countEnum = {};
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
			const events = await client.AuditLogManager.getEvents();
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
			const listeners = await client.AuditLogManager.getListeners();
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
		try {
			const session = await getSession(client, req.headers);
			const { type, events, name, targetUrl } = req.body;

			if (typeof type !== 'string' || !['WEBHOOK', 'NOTIFICATION'].includes(type)) return Error.IncorrectQuery(res, 'Invalid listener type provided.');
			if (!Array.isArray(events) || events.some((e) => typeof e !== 'string')) return Error.IncorrectQuery(res, 'Invalid events provided.');
			if (typeof name !== 'string' || name.length === 0) return Error.IncorrectQuery(res, 'Invalid name provided.');
			if (type == 'WEBHOOK' && (typeof targetUrl !== 'string' || targetUrl.length === 0)) return Error.IncorrectQuery(res, 'Invalid targetUrl provided.');

			const listener = await client.AuditLogManager.addListener({ userId: session!.userId, type: type as ListenerType, eventNames: events, name, targetUrl });
			res.json({ success: 'Successfully created log listener.', listener });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to create log listener.');
		}
	};
};

// Endpoint: DELETE /api/admin/logs/listeners/:id
export const deleteLogListener = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { id } = req.params;
			await client.AuditLogManager.removeListener(id);
			res.json({ success: 'Successfully deleted log listener.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete log listener.');
		}
	};
};

// Endpoint: PATCH /api/admin/logs/listeners/:id
export const patchLogListener = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { id } = req.params;

		try {
			const session = await getSession(client, req.headers);
			const { type, events, name, targetUrl } = req.body;

			if (typeof type !== 'string' || !['WEBHOOK', 'NOTIFICATION'].includes(type)) return Error.IncorrectQuery(res, 'Invalid listener type provided.');
			if (!Array.isArray(events) || events.some((e) => typeof e !== 'string')) return Error.IncorrectQuery(res, 'Invalid events provided.');
			if (typeof name !== 'string' || name.length === 0) return Error.IncorrectQuery(res, 'Invalid name provided.');
			if (type == 'WEBHOOK' && (typeof targetUrl !== 'string' || targetUrl.length === 0)) return Error.IncorrectQuery(res, 'Invalid targetUrl provided.');

			const listener = await client.AuditLogManager.updateListener({ id, userId: session!.userId, type: type as ListenerType, eventNames: events, name, targetUrl });
			res.json({ success: 'Successfully created log listener.', listener });
		} catch (err) {
			client.logger.error(err);
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
		} catch (error) {
			client.logger.error(error);
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