import type { createPlan, updatePlan } from '@/types/database/Plan';
import type { Plan } from '@/types/generated/client';
import client from './prisma';

export default class PlanAccessor {
	cache: Map<string, Plan>;

	constructor() {
		this.cache = new Map();
	}

	async create(data: createPlan) {
		const plan = await client.plan.create({
			data,
		});

		this.cache.set(plan.id, plan);
		return plan;
	}

	async update(data: updatePlan) {
		const plan = await client.plan.update({
			where: {
				id: data.id,
			},
			data,
		});

		this.cache.set(plan.id, plan);
		return plan;
	}

	async delete(planId: string) {
		const plan = await client.plan.delete({
			where: {
				id: planId,
			},
		});

		this.cache.delete(plan.id);
		return plan;
	}

	async fetchAll() {
		return client.plan.findMany();
	}

	async fetchDefault() {
		return client.plan.findFirst({
			where: {
				isDefault: true,
			},
		});
	}

	async fetchPayingUsers() {
		return client.user.count({
			where: {
				plan: {
					price: {
						gt: 0,
					},
				},
			},
		});
	}

	async fetchNewCustomers() {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const subscribers = await client.subscription.count({
			where: {
				status: 'active',
				periodStart: {
					gte: thirtyDaysAgo,
				},
			},
		});

		return subscribers;
	}

	async fetchMostPopular() {
		 const plans = await client.plan.findMany({
			include: {
				_count: {
					select: { users: true },
				},
			},
			orderBy: {
				users: {
					_count: 'desc',
				},
			},
			take: 1,
		});

		return plans[0]?.name ?? null;
	}

	async fetchSubscriptionStartsBetweenTwoDates(oldDate: Date, newDate: Date): Promise<number> {
		return await client.subscription.count({
			where: {
				periodStart: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
	}

	async getTotalRevenue() {
		// Fetch all active subscriptions and group them by plan
		const activeSubs = await client.subscription.groupBy({
			by: ['plan'],
			where: { status: 'active' },
			_count: { plan: true },
		});

		if (!activeSubs.length) return 0;

		// Get all plan prices for those plan names
		const plans = await client.plan.findMany({
			where: {
				name: {
					in: activeSubs.map(s => s.plan),
				},
			},
			select: {
				name: true,
				price: true,
			},
		});

		// Map plans to quick lookup
		const priceMap = Object.fromEntries(plans.map(p => [p.name, Number(p.price)]));

		// Calculate total
		const total = activeSubs.reduce((sum, sub) => {
			const planPrice = priceMap[sub.plan] ?? 0;
			return sum + planPrice * sub._count.plan;
		}, 0);

		return total;
	}
}