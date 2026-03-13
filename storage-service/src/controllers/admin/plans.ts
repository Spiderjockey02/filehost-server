import { buildYearlyHistory, buildMonthlyHistory, buildDailyHistory, buildHourlyHistory } from '@/utils/analyticTimeSeries';
import { createPlanSchema, validateInterval } from '@/validators';
import type { Request, Response } from 'express';
import type Client from '@/helpers/Client';
import { getSession } from '@/middleware';
import type { CountMap } from '@/types';
import { Error, getIP } from '@/utils';

// Endpoint: GET /api/admin/plan/stats
export const getPlanStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [payingUsers, newCustomers, mostPopular, totalRevenue] = await Promise.all([
				client.PlanManager.fetchPayingUsers(),
				client.PlanManager.fetchNewCustomers(),
				client.PlanManager.fetchMostPopular(),
				client.PlanManager.fetchTotalRevenue(),
			]);

			res.json({ payingUsers, newCustomers, mostPopular, totalRevenue });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch.');
		}
	};
};

// Endpoint: GET /api/admin/plan/trends
export const getPlanTrends = (client: Client) => {
	return async (req: Request, res: Response) => {
		const interval = req.query.interval;
		const result = validateInterval.safeParse(interval);
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		let data: CountMap = {};
		switch (result.data) {
			case 'yearly': {
				data = await buildYearlyHistory({ func: client.PlanManager.fetchSubscriptionStartsBetweenTwoDates });
				return res.json({ data });
			}
			case 'monthly': {
				data = await buildMonthlyHistory({ func: client.PlanManager.fetchSubscriptionStartsBetweenTwoDates });
				return res.json({ data });
			}
			case 'daily': {
				data = await buildDailyHistory({ func: client.PlanManager.fetchSubscriptionStartsBetweenTwoDates });
				return res.json({ data });
			}
			case 'hourly': {
				data = await buildHourlyHistory({ func: client.PlanManager.fetchSubscriptionStartsBetweenTwoDates });
				return res.json({ data });
			}
		}
	};
};

// Endpoint: POST /api/admin/plan
export const postPlan = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { name, price, maxStorageSize, maxFileSize, retentionDays: deletedFileRetentionDays, priceId } = req.body;
		const session = await getSession(client, req.headers);

		const result = createPlanSchema.safeParse({ name, price, maxStorageSize, maxFileSize, deletedFileRetentionDays, priceId });
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		try {
			const parsedStorageSize = result.data.maxStorageSize == undefined ? undefined : result.data.maxStorageSize * (1024 ** 3);
			const parsedFileSize = result.data.maxFileSize == undefined ? undefined : result.data.maxFileSize * (1024 ** 3);
			const plan = await client.PlanManager.create({ ...result.data, maxStorageSize: parsedStorageSize, maxFileSize: parsedFileSize });

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SUBSCRIPTION',
					eventName: 'PLAN_CREATED',
					message: 'Successfully created new plan.',
					resourceId: plan.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully created new plan.' });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SUBSCRIPTION',
					eventName: 'PLAN_CREATED',
					message: `Failed to create new plan due to error: ${err}.`,
					resourceId: '',
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			return Error.GenericError(res, 'Failed to create new plan.');
		}
	};
};

// Endpoint: PATCH /api/admin/plan/:planId
export const patchPlan = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { name, price, maxStorageSize, maxFileSize, retentionDays: deletedFileRetentionDays, priceId } = req.body;
		const session = await getSession(client, req.headers);
		const planId = req.params.planId;

		// Validate input
		const result = createPlanSchema.safeParse({ name, price, maxStorageSize, maxFileSize, deletedFileRetentionDays, priceId });
		if (typeof planId !== 'string') return Error.IncorrectQuery(res, 'Plan ID is required.');
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		try {
			const parsedStorageSize = result.data.maxStorageSize == undefined ? undefined : result.data.maxStorageSize * (1024 ** 3);
			const parsedFileSize = result.data.maxFileSize == undefined ? undefined : result.data.maxFileSize * (1024 ** 3);
			const plan = await client.PlanManager.update({ ...result.data, id: planId, maxStorageSize: parsedStorageSize, maxFileSize: parsedFileSize });

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SUBSCRIPTION',
					eventName: 'PLAN_UPDATED',
					message: 'Successfully updated plan.',
					resourceId: plan.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully updated plan.' });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SUBSCRIPTION',
					eventName: 'PLAN_UPDATED',
					message: `Failed to update plan due to error: ${err}.`,
					resourceId: planId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			return Error.GenericError(res, 'Failed to update plan.');
		}
	};
};

// Endpoint: DELETE /api/admin/plan/:planId
export const deletePlan = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		const planId = req.params.planId;
		if (typeof planId !== 'string') return Error.IncorrectQuery(res, 'Plan ID is required.');

		try {
			const plan = await client.PlanManager.delete(planId);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SUBSCRIPTION',
					eventName: 'PLAN_DELETED',
					message: 'Successfully deleted plan.',
					resourceId: plan.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully deleted plan.' });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SUBSCRIPTION',
					eventName: 'PLAN_DELETED',
					message: `Failed to delete plan due to error: ${err}.`,
					resourceId: planId,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			return Error.GenericError(res, 'Failed to delete plan.');
		}
	};
};