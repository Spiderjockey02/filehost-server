import type { GetUsers, fetchUserbyParam, updateUser, UserToGroupProps, FullUser, storageDirection } from '../types/database/User';
import { LRUCache } from 'lru-cache';
import client from './prisma';
import { Pagination } from 'src/types/database/File';

export default class UserManager {
	cache: LRUCache<string, FullUser>;

	constructor() {
		this.cache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});
	}

	/**
	  * Updates a user
	  * @param {updateUser} data The user data.
		* @returns {UserWithGroup} The updated user.
	*/
	async update(data: updateUser): Promise<FullUser> {
		const user = await client.user.update({
			where: {
				id: data.id,
			},
			data: {
				email: data.email,
				totalStorageSize: data.totalStorageSize,
				updatedAt: data.updatedAt,
			},
			include: {
				group: true,
				notifications: true,
			},
		});
		this.cache.set(user.id, user);
		return user;
	}

	/**
	  * Fetch all users
	  * @param {GetUsers} data The user data.
		* @returns {UserWithGroup[]} The users.
	*/
	async fetchAll({ group, page = 0 }: GetUsers & Pagination): Promise<FullUser[]> {
		return client.user.findMany({
			include: {
				group: group,
				notifications: true,
				activity: {
					take: 1,
					orderBy: {
						timestamp: 'desc',
					},
				},
				_count: {
					select: {
						files: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 20,
			skip: page * 20,
		});
	}

	/**
	  * Update a user's group
	  * @param {UserToGroupProps} data The user data.
		* @returns {UserWithGroup} The updated user.
	*/
	async addUserToGroup(data: UserToGroupProps): Promise<FullUser> {
		return client.user.update({
			where: {
				id: data.userId,
			},
			data: {
				group: {
					connect: {
						id: data.groupId,
					},
				},
			},
			include: {
				group: true,
				notifications: true,
			},
		});
	}

	/**
	  * Fetch a user by a parameter
	  * @param {fetchUserbyParam} data The user data.
		* @returns {UserWithGroup | null} The updated user.
	*/
	async fetchbyParam(data: fetchUserbyParam): Promise<FullUser | null> {
		let user = !data.force ? (this.cache.find(u => u.id === data.id || u.email === data.email) ?? null) : null;
		if (user == null) {
			user = await client.user.findUnique({
				where: {
					email: data.email,
					id: data.id,
				},
				include: {
					group: true,
					notifications: true,
					sessions: true,
					_count: {
						select: {
							files: true,
						},
					},
				},
			});
			if (user != null) this.cache.set(user?.id, user);
		}
		return user;
	}

	/**
	  * Modify the storage size of a user
	  * @param {string} userId The ID of the user
	  * @param {bigint} size The size to modify the storage size by.
	  * @param {storageDirection} direction The direction to modify the storage size.
	  * @returns The updated user.
	*/
	async modifyStorageSize(userId: string, size: bigint, direction: storageDirection): Promise<FullUser> {
		return client.user.update({
			where: {
				id: userId,
			},
			data: {
				totalStorageSize: {
					decrement: direction === 'DECRE' ? size : undefined,
					increment: direction === 'INCRE' ? size : undefined,
				},
			},
			include: {
				group: true,
				notifications: true,
			},
		});
	}

	/**
	  * Fetch the total count of users
		* @returns The total count of users.
	*/
	async fetchTotal() {
		const last7days = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

		const [total, active, newUser] = await Promise.all([
			client.user.count(),
			client.user.count({
				where: {
					sessions: {
						some: {
							createdAt: {
								gte: last7days,
							},
						},
					},
				},
			}),
			client.user.count({
				where: {
					createdAt: {
						// Fetch users that have been created in the last week
						gte: last7days,
					},
				},
			}),
		]);

		return { total, active, new: newUser };
	}

	/**
		* Fetch the number of users who joined between 2 dates
		* @param {Date} oldDate The old date.
		* @param {Date} newDate The new date.
		* @returns The number of users
	*/
	async fetchUserJoinesBetweenTwoDates(oldDate: Date, newDate: Date) {
		return client.user.count({
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
	}

	/**
		* Fetch a unique list of user IDs that have uploaded between two dates
		* @param {Date} oldDate The old date.
		* @param {Date} newDate The new date.
		* @returns The array of user IDs.
	*/
	async fetchUsersWhoUploadedBetweenTwoDates(oldDate: Date, newDate: Date) {
		const files = await client.file.findMany({
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});

		const users = [...new Set(files.map(f => f.userId))];
		return users;
	}

	/**
	  * Fetch the number of users by language code
	  * @returns The number of users by language code
	*/
	async fetchGroupCountsByLanguageCodes() {
		const languageCode = await client.user.groupBy({
			by: ['languageCode'],
		});

		const codesWithCount: {[ key: string ]: number} = {};
		for (const code of languageCode) {
			const count = await client.user.count({
				where: {
					languageCode: code.languageCode,
				},
			});

			codesWithCount[code.languageCode] = count;
		}

		return codesWithCount;
	}

	/**
	  * Fetch the number of users by email domain
	  * @returns The number of users by group
	*/
	async fetchCountsByEmailDomain() {
		const users = await client.user.findMany({
			select: {
				email: true,
			},
		});

		const domainCount: Record<string, number> = {};
		for (const user of users) {
			const email = user.email!;
			const domain = email.split('@')[1].toLowerCase();
			if (domain) domainCount[domain] = (domainCount[domain] || 0) + 1;
		}

		return domainCount;
	}

	/**
		* Gets the average file size
		* @returns The average file size.
	*/
	fetchAverageStorageUsed() {
		return client.user.aggregate({
			_avg: {
				totalStorageSize: true,
			},
		});
	}

	/**
		* Gets the average file size
		* @returns The average file size.
	*/
	fetchBannedTotal() {
		return client.user.count({
			where: {
				banned: true,
			},
		});
	}

	/**
		* Fetch the count of each provider the users have logged / registered in using.
		* @returns An object of providers with values the number of users
	*/
	async fetchSignUpSource() {
		const accounts = await client.account.findMany();

		const domainCount: Record<string, number> = {};
		for (const account of accounts) {
			const providerId = account.providerId!;
			domainCount[providerId] = (domainCount[providerId] || 0) + 1;
		}

		return domainCount;
	}
}
