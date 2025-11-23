import type { fetchActivity, fetchUserAgentsParams, UserActivityInput } from '@/types/database/UserActivity';
import type { UserActivity, UserAgent } from '@/types/generated/client';
import type { Pagination } from '@/types/database/File';
import client from './prisma';

export default class UserActivityAccessor {
	/**
	  *	Create a bulk activity
		*	@param {UserActivityInput[]} data
	*/
	async createMany(data: UserActivityInput[]) {
		return client.userActivity.createMany({
			data,
		});
	}

	/**
	  * Fetch the total bytes recieved and sent in user activity
	*/
	async fetchTotalBytesInActivity() {
		const result = await client.userActivity.aggregate({
			_sum: {
				incomingBytes: true,
				outgoingBytes: true,
			},
		});
		return result._sum;
	}

	/**
	  *	Fetch the counts of each HTTP method in the user activity
	*/
	async fetchHTTPMethods() {
		const result = await client.userActivity.groupBy({
			by: ['method'],
			_count: { method: true },
		});

		return result.map(r => ({
			method: r.method,
			_count: { history: r._count.method },
		}));
	}

	/**
	  *	Fetch the counts of each HTTP status in the user activity
	*/
	async fetchHTTPStatus() {
		const result = await client.userActivity.groupBy({
			by: ['statusCode'],
			_count: { statusCode: true },
		});

		return result.map(r => ({
			code: r.statusCode,
			_count: { history: r._count.statusCode },
		}));
	}

	/**
	  * Fetch the average duration of all API request
	*/
	async averageDuration() {
		const result = await client.userActivity.aggregate({
			_avg: {
				durationMs: true,
			},
		});
		return result._avg.durationMs ?? 0;
	}

	/**
	  * Fetch total user activity
		* @param {fetchActivity} data Filter object
	*/
	async fetchTotal({ userId, statusCode, method }: fetchActivity) {
		const result = await client.userActivity.count({
			where: {
				userId,
				statusCode,
				method,
			},
		});
		return result;
	}

	/**
	  * Fetch list of activity between two dates
	  * @param oldDate The first date
		* @param newDate The old date
	*/
	async fetchActivityBetweenTwoDates(oldDate: Date, newDate: Date) {
		return client.userActivity.count({
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
	}

	/**
	  * Calculate traffic between two dates
	  * @param oldDate The first date
		* @param newDate The old date
	*/
	async calculateTransferBetweenTwoDates(oldDate: Date, newDate: Date) {
		const result = await client.userActivity.aggregate({
			_sum: {
				incomingBytes: true,
				outgoingBytes: true,
			},
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
		return result._sum;
	}

	/**
	  * Fetch the list of activity based on the filters
		* @param {fetchActivity & Pagination} data the filters
		* @returns {UserActivity[]} list of user activity
	*/
	async fetchActivity({ userId, statusCode, method, page = 0 }: fetchActivity & Pagination): Promise<UserActivity[]> {
		return client.userActivity.findMany({
			where: {
				userId,
				statusCode,
				method,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 20,
			skip: page * 20,
		});
	}

	/**
	  * Fetch users who had activity between two dates
	  * @param oldDate The first date
		* @param newDate The old date
	  * @returns
	*/
	async fetchUsersWhoHadActivityBetweenTwoDates(oldDate: Date, newDate: Date): Promise<string[]> {
		const activity = await client.userActivity.findMany({
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});

		const users = [...new Set(activity.map(s => s.userId).filter(s => s !== null))];
		return users;
	}

	/**
	  * Fetch the list of user agents
	  * @returns {UserAgent[]} list of user agents
	*/
	async fetchUserAgents({ sortBy, sortOrder, page = 0 }: fetchUserAgentsParams): Promise<[UserAgent[], number]> {
		return Promise.all([
			client.userAgent.findMany({
				include: {
					_count: true,
				},
				orderBy: {
					agent: sortBy == 'name' ? sortOrder : undefined,
					activity: sortBy == 'activity' ? {
						_count: sortOrder,
					} : undefined,
					logs: sortBy == 'logs' ? {
						_count: sortOrder,
					} : undefined,
				},
				take: 20,
				skip: page * 20,
			}),
			client.userAgent.count(),
		]);
	}
}