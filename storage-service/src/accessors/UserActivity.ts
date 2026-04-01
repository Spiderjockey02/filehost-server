import type { fetchActivityParams, fetchTotalParams, fetchUserAgentsParams, NetworkFilter, UserActivityInput } from '@/types/database/UserActivity';
import type { UserActivity, UserAgent } from '@/types/generated/client';
import client from '.';

export default class UserActivityAccessor {
	/**
	  *	Create a bulk activity
		*	@param {UserActivityInput[]} data A list of user activity data
		* @returns {{count: number}} The number of entries that were created
	*/
	async createMany(data: UserActivityInput[]): Promise<{count: number}> {
		return client.userActivity.createMany({
			data,
		});
	}

	/**
	  * Fetch the total bytes recieved and sent in user activity
	*/
	async fetchTotalBytesInActivity() {
		try {
			const result = await client.userActivity.aggregate({
				_sum: {
					incomingBytes: true,
					outgoingBytes: true,
				},
			});
			return result._sum;
		} catch (err) {
			throw err;
		}
	}

	/**
	  *	Fetch the counts of each HTTP method in the user activity
	*/
	async fetchHTTPMethods() {
		try {
			const result = await client.userActivity.groupBy({
				by: ['method'],
				_count: { method: true },
			});

			return result.map(r => ({
				method: r.method,
				_count: r._count.method,
			}));
		} catch (err) {
			throw err;
		}
	}

	/**
	  *	Fetch the counts of each HTTP status in the user activity
		* @returns count of each HTTP status
	*/
	async fetchHTTPStatus() {
		try {
			const result = await client.userActivity.groupBy({
				by: ['statusCode'],
				_count: { statusCode: true },
			});

			return result.map(r => ({
				code: r.statusCode,
				_count: r._count.statusCode,
			}));
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch the average duration of all API request
		* @returns {number} Average duration
	*/
	async averageDuration(): Promise<number> {
		try {
			const result = await client.userActivity.aggregate({
				_avg: {
					durationMs: true,
				},
			});
			return result._avg.durationMs ?? 0;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch total user activity
		* @param {fetchActivity} filters Filter object
	*/
	async fetchTotal(filters?: fetchTotalParams) {
		return client.userActivity.count({
			where: {
				userId: filters?.userId,
				statusCode: filters?.statusCode,
				method: filters?.method,
			},
		});
	}

	/**
	  * Fetch list of activity between two dates
	  * @param {Date} oldDate The first date
		* @param {Date} newDate The old date
		* @param {?NetworkFilter} filter For userId and/or storageId
	*/
	async fetchActivityBetweenTwoDates(oldDate: Date, newDate: Date, filter?: NetworkFilter) {
		return client.userActivity.count({
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
				userId: filter?.userId,
				user: {
					storageId: filter?.storageId,
				},
			},
		});
	}

	/**
	  * Calculate traffic between two dates
	  * @param {Date} oldDate The first date
		* @param {Date} newDate The old date
		* @param {?NetworkFilter} filter For userId and/or storageId
	*/
	async calculateTransferBetweenTwoDates(oldDate: Date, newDate: Date, filter?: NetworkFilter) {
		try {
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
					userId: filter?.userId,
					user: {
						storageId: filter?.storageId,
					},
				},
			});

			return {
				incomingBytes: result._sum.incomingBytes ?? 0,
				outgoingBytes: result._sum.outgoingBytes ?? 0,
			};
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch the list of activity based on the filters
		* @param {fetchActivity & Pagination} data the filters
		* @returns {UserActivity[]} list of user activity
	*/
	async fetchActivity({ userId, statusCode, method, page = 0 }: fetchActivityParams): Promise<UserActivity[]> {
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
	  * @returns {string[]} An array of user Id's
	*/
	async fetchUsersWhoHadActivityBetweenTwoDates(oldDate: Date, newDate: Date): Promise<string[]> {
		try {
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
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch the list of user agents
		* @param {fetchUserAgentsParams} param0
	  * @returns {[UserAgent[], number]} list of user agents
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