import Client from 'src/helpers/Client';
import type { Request, Response } from 'express';
import { Error } from '../../utils';
import { HTTPMethod } from '@prisma/client';

// Endpoint: GET /api/admin/network/stats
export const getNetworkStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [network, methods, status, duration, total] = await Promise.all([
				client.userActivityManager.fetchTotalBytesInActivity(),
				client.userActivityManager.fetchHTTPMethods(),
				client.userActivityManager.fetchHTTPStatus(),
				client.userActivityManager.averageDuration(),
				client.userActivityManager.fetchTotal({}),
			]);

			res.json({ network, methods: methods.filter(s => s._count.history > 0).map(m => ({ method: m.method, count: m._count.history })), status: status.filter(s => s._count.history > 0).map(s => ({ status: s.code, count: s._count.history })), duration, total });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to fetch logs.');
		}
	};
};

// Endpoint: GET /api/admin/network/requests
type countEnum = { [key: string | number]: number }
export const getActivityRequests = (client: Client) => {
	return async (req: Request, res: Response) => {
		const frame = req.query.frame;
		if (!frame || typeof frame !== 'string' || !['yearly', 'monthly', 'daily', 'hourly'].includes(frame)) return Error.IncorrectQuery(res, `frame must be on one of the following: ${['yearly', 'monthly', 'daily', 'hourly'].join(', ')}`);

		switch (frame) {
			case 'yearly': {
				const years: countEnum = {};
				const currentYear = new Date().getFullYear();
				let cumulativeTotal = await client.userActivityManager.fetchActivityBetweenTwoDates(new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1));

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const files = await client.userActivityManager.fetchActivityBetweenTwoDates(start, end);
					cumulativeTotal += files;
					years[currentYear - i] = cumulativeTotal;
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

				let cumulativeTotal = await client.userActivityManager.fetchActivityBetweenTwoDates(new Date(2023, 0, 1), new Date(firstMonthDate));
				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const files = await client.userActivityManager.fetchActivityBetweenTwoDates(start, end);
					cumulativeTotal += files;
					months[monthName] = cumulativeTotal;
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
				let cumulativeTotal = await client.userActivityManager.fetchActivityBetweenTwoDates(new Date(2023, 0, 1), frameStart);

				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const files = await client.userActivityManager.fetchActivityBetweenTwoDates(start, end);
					cumulativeTotal += files;
					days[dateStr] = cumulativeTotal;
				}
				res.json({ days });
				break;
			}
			case 'hourly': {
				const hours: countEnum = {};
				const now = new Date();
				const frameStart = new Date(now);
				frameStart.setHours(now.getHours() - 23, 0, 0, 0);

				let cumulativeTotal = await client.userActivityManager.fetchActivityBetweenTwoDates(new Date(2023, 0, 1), new Date(frameStart));

				for (let i = 0; i < 24; i++) {
					const start = new Date(frameStart);
					start.setHours(frameStart.getHours() + i);
					const end = new Date(start);
					end.setHours(start.getHours() + 1);

					const hourLabel = `${start.getHours().toString().padStart(2, '0')}:00`;
					const files = await client.userActivityManager.fetchActivityBetweenTwoDates(start, end);
					cumulativeTotal += files;
					hours[hourLabel] = cumulativeTotal;
				}
				res.json({ hours });
				break;
			}
		}
	};
};


type histoyrDtata = {
	[key: string]: {
		incomingBytes: number | null
		outgoingBytes: number | null
	}
}

// Endpoint: GET /api/admin/network/traffic
export const getActivityTraffic = (client: Client) => {
	return async (req: Request, res: Response) => {

		const frame = req.query.frame;
		if (!frame || typeof frame !== 'string' || !['yearly', 'monthly', 'daily', 'hourly'].includes(frame)) return Error.IncorrectQuery(res, `frame must be on one of the following: ${['yearly', 'monthly', 'daily', 'hourly'].join(', ')}`);

		switch (frame) {
			case 'yearly': {
				const years: histoyrDtata = {};
				const currentYear = new Date().getFullYear();

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const data = await client.userActivityManager.calculateTransferBetweenTwoDates(start, end);
					if (data.incomingBytes === null) data.incomingBytes = 0;
					if (data.outgoingBytes === null) data.outgoingBytes = 0;
					years[currentYear - i] = data;
				}
				res.json({ years });
				break;
			}
			case 'monthly': {
				const months: histoyrDtata = {};
				const current = new Date();
				current.setDate(1);

				const firstMonthDate = new Date();
				firstMonthDate.setMonth(current.getMonth() - 11);

				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const data = await client.userActivityManager.calculateTransferBetweenTwoDates(start, end);
					if (data.incomingBytes === null) data.incomingBytes = 0;
					if (data.outgoingBytes === null) data.outgoingBytes = 0;
					months[monthName] = data;
				}
				res.json({ months });
				break;
			}
			case 'daily': {
				const days: histoyrDtata = {};
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const frameStart = new Date(today);
				frameStart.setDate(today.getDate() - 14);

				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const data = await client.userActivityManager.calculateTransferBetweenTwoDates(start, end);
					if (data.incomingBytes === null) data.incomingBytes = 0;
					if (data.outgoingBytes === null) data.outgoingBytes = 0;
					days[dateStr] = data;
				}
				res.json({ days });
				break;
			}
			case 'hourly': {
				const hours: histoyrDtata = {};
				const now = new Date();
				const frameStart = new Date(now);
				frameStart.setHours(now.getHours() - 23, 0, 0, 0);

				for (let i = 0; i < 24; i++) {
					const start = new Date(frameStart);
					start.setHours(frameStart.getHours() + i);
					const end = new Date(start);
					end.setHours(start.getHours() + 1);

					const hourLabel = `${start.getHours().toString().padStart(2, '0')}:00`;
					const data = await client.userActivityManager.calculateTransferBetweenTwoDates(start, end);
					if (data.incomingBytes === null) data.incomingBytes = 0;
					if (data.outgoingBytes === null) data.outgoingBytes = 0;

					hours[hourLabel] = data;
				}
				res.json({ hours });
				break;
			}
		};
	};
};

// Endpoint: GET /api/admin/network/list
export const getActivityList = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			// Allow pagination
			const { page, userId, status, method } = req.query;

			// Validate page
			if (page !== undefined && (typeof page !== 'string' || !/^\d+$/.test(page) || Number(page) < 0)) return Error.IncorrectQuery(res, 'page must be a positive number.');

			// Validate `status` as a number
			if (typeof status == 'string' && isNaN(Number(status))) return Error.IncorrectQuery(res, 'status if present must be a number.');
			const validMethods = Object.values(HTTPMethod) as string[];
			const parsedMethod = typeof method === 'string' && validMethods.includes(method) ? method as HTTPMethod : undefined;

			const [activity, total] = await Promise.all([
				client.userActivityManager.fetchActivity({
					page: page ? Number(page) : undefined, userId: userId ? `${userId}` : undefined, statusCode: status?.length == 0 ? undefined : Number(status), method: parsedMethod,
				}),
				client.userActivityManager.fetchTotal({
					userId: userId ? `${userId}` : undefined, statusCode: status?.length == 0 ? undefined : Number(status), method: parsedMethod,
				}),
			]);
			res.json({ activity, total });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch recently uploaded files.');
		}
	};
};

// Endpoint: GET /api/admin/network/user-agents
export const getUserAgents = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const agents = await client.userActivityManager.fetchUserAgents();
			res.json({ agents });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch user agents.');
		}
	};
};