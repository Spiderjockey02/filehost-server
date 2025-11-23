import { createPlanSchema, validateFrame } from '@/validators';
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
				client.PlanManager.getTotalRevenue(),
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
		const frame = req.query.frame;
		const result = validateFrame.safeParse(frame);
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		switch (frame) {
			case 'yearly': {
				const years: CountMap = {};
				const currentYear = new Date().getFullYear();
				let cumulativeTotal = await client.PlanManager.fetchSubscriptionStartsBetweenTwoDates(new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1));

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const files = await client.PlanManager.fetchSubscriptionStartsBetweenTwoDates(start, end);
					cumulativeTotal += files;
					years[currentYear - i] = cumulativeTotal;
				}
				res.json({ years });
				break;
			}
			case 'monthly': {
				const months: CountMap = {};
				const current = new Date();
				current.setDate(1);

				const firstMonthDate = new Date();
				firstMonthDate.setMonth(current.getMonth() - 11);

				let cumulativeTotal = await client.PlanManager.fetchSubscriptionStartsBetweenTwoDates(new Date(2023, 0, 1), new Date(firstMonthDate));
				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const files = await client.PlanManager.fetchSubscriptionStartsBetweenTwoDates(start, end);
					cumulativeTotal += files;
					months[monthName] = cumulativeTotal;
				}
				res.json({ months });
				break;
			}
			case 'daily': {
				const days: CountMap = {};
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const frameStart = new Date(today);
				frameStart.setDate(today.getDate() - 14);
				let cumulativeTotal = await client.PlanManager.fetchSubscriptionStartsBetweenTwoDates(new Date(2023, 0, 1), frameStart);

				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const files = await client.PlanManager.fetchSubscriptionStartsBetweenTwoDates(start, end);
					cumulativeTotal += files;
					days[dateStr] = cumulativeTotal;
				}
				res.json({ days });
				break;
			}
			case 'hourly': {
				const hours: CountMap = {};
				const now = new Date();
				const frameStart = new Date(now);
				frameStart.setHours(now.getHours() - 23, 0, 0, 0);

				let cumulativeTotal = await client.PlanManager.fetchSubscriptionStartsBetweenTwoDates(new Date(2023, 0, 1), new Date(frameStart));

				for (let i = 0; i < 24; i++) {
					const start = new Date(frameStart);
					start.setHours(frameStart.getHours() + i);
					const end = new Date(start);
					end.setHours(start.getHours() + 1);

					const hourLabel = `${start.getHours().toString().padStart(2, '0')}:00`;
					const files = await client.PlanManager.fetchSubscriptionStartsBetweenTwoDates(start, end);
					cumulativeTotal += files;
					hours[hourLabel] = cumulativeTotal;
				}
				res.json({ hours });
				break;
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
					message: `Created new plan: ${plan.name}`,
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
					message: `Failed to create new plan: ${err}`,
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

		const result = createPlanSchema.safeParse({ name, price, maxStorageSize, maxFileSize, deletedFileRetentionDays, priceId });
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
					message: `Updated plan: ${plan.name}`,
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
					message: `Failed to update plan: ${err}`,
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

		try {
			const plan = await client.PlanManager.delete(planId);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'SUBSCRIPTION',
					eventName: 'PLAN_DELETED',
					message: `Deleted plan: ${plan.name}`,
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
					message: `Failed to delete plan: ${err}`,
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