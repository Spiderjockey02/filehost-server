import type { createPlan, updatePlan } from '@/types/database/Plan';
import type { Plan } from '@/types/generated/client';
import client from './prisma';

export default class PlanAccessor {
	cache: Map<string, Plan>;

	constructor() {
		this.cache = new Map();
	}

	/**
	  * Creates a new plan in the database.
	  * @param {createPlan} data The data for the new plan.
	  * @returns {Plan} The created plan.
	*/
	async create(data: createPlan): Promise<Plan> {
		try {
			const plan = await client.plan.create({
				data,
			});

			this.cache.set(plan.id, plan);
			return plan;
		} catch (err) {
			throw err;
		}
	}

	/**
	 * Updates an existing plan in the database.
	 * @param {updatePlan} data The updated data for the plan.
	 * @returns {Plan} The updated plan.
	*/
	async update(data: updatePlan): Promise<Plan> {
		try {
			const plan = await client.plan.update({
				where: {
					id: data.id,
				},
				data,
			});

			this.cache.set(plan.id, plan);
			return plan;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Deletes a plan from the database.
	  * @param {string} planId The ID of the plan to delete.
	  * @returns {Plan} The deleted plan.
	*/
	async delete(planId: string): Promise<Plan> {
		try {
			const plan = await client.plan.delete({
				where: {
					id: planId,
				},
			});

			this.cache.delete(plan.id);
			return plan;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetches all plans from the database.
	  * @returns {Plan[]} An array of all plans.
	*/
	async fetchAll(): Promise<Plan[]> {
		return client.plan.findMany();
	}

	/**
	  * Fetches the default plan from the database.
	  * @returns {Plan | null} The default plan or null if not found.
	*/
	async fetchDefault(): Promise<Plan | null> {
		return client.plan.findFirst({
			where: {
				isDefault: true,
			},
		});
	}

	/**
	  * Fetches the number of paying users.
	  * @returns {number} The count of paying users.
	*/
	async fetchPayingUsers(): Promise<number> {
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

	/**
	  * Fetches the number of new customers in the last 30 days.
	  * @returns {number} The count of new customers.
	*/
	async fetchNewCustomers(): Promise<number> {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		try {
			const subscribers = await client.subscription.count({
				where: {
					status: 'active',
					periodStart: {
						gte: thirtyDaysAgo,
					},
				},
			});

			return subscribers;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetches the most popular plan based on the number of users subscribed.
	  * @returns {string | null} The name of the most popular plan or null if none found.
	*/
	async fetchMostPopular(): Promise<string | null> {
		try {
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
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetches the number of subscriptions that started between two dates.
	  * @param {Date} oldDate The start date.
	  * @param {Date} newDate The end date.
	  * @returns {number} The count of subscriptions.
	*/
	async fetchSubscriptionStartsBetweenTwoDates(oldDate: Date, newDate: Date): Promise<number> {
		return client.subscription.count({
			where: {
				periodStart: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
	}

	/**
	  * Calculates the total revenue from all active subscriptions.
	  * @returns {number} The total revenue.
	*/
	async fetchTotalRevenue(): Promise<number> {
		try {
			// Fetch all active subscriptions and group them by plan
			const activeSubs = await client.subscription.groupBy({
				by: ['plan'],
				where: { status: 'active' },
				_count: { plan: true },
			});
			if (!activeSubs.length) return 0;

			// Fetch all plan prices for those plan names
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
		} catch (err) {
			throw err;
		}
	}
}