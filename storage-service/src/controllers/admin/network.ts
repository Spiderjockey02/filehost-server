import { buildYearlyHistory, buildMonthlyHistory, buildDailyHistory, buildHourlyHistory } from '@/utils/analyticTimeSeries';
import { validateIntervalWithFilters, validateNetworkList } from '@/validators';
import type { Request, Response } from 'express';
import type Client from '@/helpers/Client';
import type { CountMap } from '@/types';
import { Error } from '@/utils';

// Endpoint: GET /api/admin/network/stats
export const getNetworkStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [network, methods, status, duration, total] = await Promise.all([
				client.userActivityManager.fetchTotalBytesInActivity(),
				client.userActivityManager.fetchHTTPMethods(),
				client.userActivityManager.fetchHTTPStatus(),
				client.userActivityManager.averageDuration(),
				client.userActivityManager.fetchTotal(),
			]);

			res.json({ network, methods: methods.filter(s => s._count > 0), status: status.filter(s => s._count > 0), duration, total });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch logs.');
		}
	};
};

// Endpoint: GET /api/admin/network/requests
export const getActivityRequests = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { interval, userId, storageId } = req.query;
		const result = validateIntervalWithFilters.safeParse({ interval, userId, storageId });
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		let data: CountMap = {};
		switch (result.data.interval) {
			case 'yearly': {
				data = await buildYearlyHistory({ func: client.userActivityManager.fetchActivityBetweenTwoDates, params: { userId: result.data.userId, storageId: result.data.storageId } });
				return res.json({ data });
			}
			case 'monthly': {
				data = await buildMonthlyHistory({ func: client.userActivityManager.fetchActivityBetweenTwoDates, params: { userId: result.data.userId, storageId: result.data.storageId } });
				return res.json({ data });
			}
			case 'daily': {
				data = await buildDailyHistory({ func: client.userActivityManager.fetchActivityBetweenTwoDates, params: { userId: result.data.userId, storageId: result.data.storageId } });
				return res.json({ data });
			}
			case 'hourly': {
				data = await buildHourlyHistory({ func: client.userActivityManager.fetchActivityBetweenTwoDates, params: { userId: result.data.userId, storageId: result.data.storageId } });
				return res.json({ data });
			}
		}
	};
};

// Endpoint: GET /api/admin/network/traffic
export const getActivityTraffic = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { interval, userId, storageId } = req.query;
		const result = validateIntervalWithFilters.safeParse({ interval, userId, storageId });
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		let data: CountMap = {};
		switch (result.data.interval) {
			case 'yearly': {
				data = await buildYearlyHistory({ func: client.userActivityManager.calculateTransferBetweenTwoDates, params: { userId: result.data.userId, storageId: result.data.storageId } });
				return res.json({ data });
			}
			case 'monthly': {
				data = await buildMonthlyHistory({ func: client.userActivityManager.calculateTransferBetweenTwoDates, params: { userId: result.data.userId, storageId: result.data.storageId } });
				return res.json({ data });
			}
			case 'daily': {
				data = await buildDailyHistory({ func: client.userActivityManager.calculateTransferBetweenTwoDates, params: { userId: result.data.userId, storageId: result.data.storageId } });
				return res.json({ data });
			}
			case 'hourly': {
				data = await buildHourlyHistory({ func: client.userActivityManager.calculateTransferBetweenTwoDates, params: { userId: result.data.userId, storageId: result.data.storageId } });
				return res.json({ data });
			}
		}
	};
};

// Endpoint: GET /api/admin/network/list
export const getActivityList = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			// Allow pagination
			const { page, userId, status, method } = req.query;
			const result = validateNetworkList.safeParse({ page, userId, status, method });
			if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

			const [activity, total] = await Promise.all([
				client.userActivityManager.fetchActivity({ page: result.data.page, userId: result.data.userId, statusCode: result.data.status, method: result.data.method }),
				client.userActivityManager.fetchTotal({ userId: result.data.userId, statusCode: result.data.status, method: result.data.method }),
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
	return async (req: Request, res: Response) => {
		try {
			const { sortBy, sortOrder, page } = req.query;
			if (typeof sortBy !== 'string' || (sortBy !== 'name' && sortBy !== 'activity' && sortBy !== 'logs')) return Error.IncorrectQuery(res, 'sortBy must be a name or activity');
			if (typeof sortOrder !== 'string' || (sortOrder !== 'desc' && sortOrder !== 'asc')) return Error.IncorrectQuery(res, 'sortOrder must be desc or asc');

			const agents = await client.userActivityManager.fetchUserAgents({ sortBy, sortOrder, page: Number(page) });
			res.json({ agents: agents[0], total: agents[1] });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch user agents.');
		}
	};
};