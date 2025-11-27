import type { GetUsers, fetchUserbyParam, updateUser, FullUser, storageDirection, setUserBan, AddToPlanProps, fetchByStorageIdParams } from '@/types/database/User';
import type { Account, User, UserBans } from '@/types/generated/client';
import type { Pagination } from '@/types/database/File';
import { LRUCache } from 'lru-cache';
import client from './prisma';

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
		try {
			const user = await client.user.update({
				where: {
					id: data.id,
				},
				data: {
					email: data.email,
					totalStorageSize: data.totalStorageSize,
					updatedAt: data.updatedAt,
					isMigrating: data.isMigrating,
					image: data.image,
					name: data.name,
					languageCode: data.languageCode,
				},
				include: {
					plan: true,
					notifications: true,
				},
			});
			this.cache.set(user.id, user);
			return user;
		} catch (error) {
			throw error;
		}
	}

	/**
	  * Fetch all users
	  * @param {GetUsers} data The user data.
		* @returns {UserWithGroup[]} The users.
	*/
	async fetchAll({ name, sortBy, sortOrder, storageId, page = 0 }: GetUsers & Pagination): Promise<FullUser[]> {
		// Fetch paginated users first
		try {

			const users = await client.user.findMany({
				where: {
					name: name?.length ? { startsWith: name } : undefined,
					storageId,
				},
				include: {
					plan: true,
					notifications: true,
					activity: {
						take: 1,
						orderBy: {
							createdAt: 'desc',
						},
					},
					_count: {
						select: {
							files: true,
						},
					},
				},
				take: 20,
				skip: page * 20,
			});

			// Sorting by uploaded file count
			if (sortBy === 'uploadedFiles') {
				users.sort((a, b) => {
					const diff = (a._count.files ?? 0) - (b._count.files ?? 0);
					return sortOrder === 'desc' ? -diff : diff;
				});
			}

			// Sorting by user createdAt
			if (sortBy === 'createdAt') {
				users.sort((a, b) => {
					const diff = a.createdAt.getTime() - b.createdAt.getTime();
					return sortOrder === 'desc' ? -diff : diff;
				});
			}

			// Sorting by last activity
			if (sortBy === 'lastActive') {
				users.sort((a, b) => {
					const aActivity = a.activity[0] !== undefined ? a.activity[0].createdAt?.getTime() : a.updatedAt.getTime();
					const bActivity = b.activity[0] !== undefined ? b.activity[0].createdAt?.getTime() : b.updatedAt.getTime();
					const diff = aActivity - bActivity;
					return sortOrder === 'desc' ? -diff : diff;
				});
			}

			return users;
		} catch (error) {
			throw error;
		}
	}

	/**
	  * Update a user's group
	  * @param {AddToPlanProps} data The user data.
		* @returns {UserWithGroup} The updated user.
	*/
	async addToPlan(data: AddToPlanProps): Promise<FullUser> {
		return client.user.update({
			where: {
				id: data.userId,
			},
			data: {
				plan: {
					connect: {
						id: data.planId,
					},
				},
			},
			include: {
				plan: true,
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
		try {
			let user = !data.force ? (this.cache.find(u => u.id === data.id || u.email === data.email) ?? null) : null;
			if (user == null) {
				user = await client.user.findUnique({
					where: {
						email: data.email,
						id: data.id,
					},
					include: {
						plan: true,
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
		} catch (error) {
			throw error;
		}
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
					set: direction === 'SET' ? size : undefined,
					decrement: direction === 'DECRE' ? size : undefined,
					increment: direction === 'INCRE' ? size : undefined,
				},
			},
			include: {
				plan: true,
				notifications: true,
			},
		});
	}

	/**
	  * Fetch the total count of users
		* @param {string} storageId The ID of the storage to filter by.
		* @returns The total count of users.
	*/
	async fetchTotal(storageId?: string) {
		try {
			// Fetch users that have been created in the last week
			const last7days = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

			const [total, active, newUser] = await Promise.all([
				client.user.count({
					where: {
						storageId,
					},
				}),
				client.user.count({
					where: {
						storageId,
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
						storageId,
						createdAt: {
							gte: last7days,
						},
					},
				}),
			]);

			return { total, active, new: newUser };
		} catch (error) {
			throw error;
		}
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
		try {
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
		} catch (error) {
			throw error;
		}
	}

	/**
	  * Fetch the number of users by language code
	  * @returns The number of users by language code
	*/
	async fetchGroupCountsByLanguageCodes() {
		try {
			const languageCode = await client.user.groupBy({
				by: ['languageCode'],
				_count: true,
			});

			const codesWithCount: { [key: string]: number } = {};
			for (const item of languageCode) {
				codesWithCount[item.languageCode] = item._count;
			}

			return codesWithCount;
		} catch (error) {
			throw error;
		}
	}

	/**
	  * Fetch the number of users by email domain
	  * @returns The number of users by group
	*/
	async fetchCountsByEmailDomain() {
		try {
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
		} catch (error) {
			throw error;
		}
	}

	/**
		* Gets the average file size
		* @returns The average file size.
	*/
	async fetchAverageStorageUsed() {
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
	async fetchBannedTotal() {
		try {
			const bans = await client.userBans.groupBy({
				by: 'userId',
			});

			return bans.length;
		} catch (error) {
			throw error;
		}
	}

	/**
		* Fetch the ban status of a user
		* @param {string} userId The ID of the user
		* @returns The ban status of the user.
	*/
	async fetchBanStatus(userId: string): Promise<UserBans | null> {
		return client.userBans.findFirst({
			where: {
				userId,
				expiresAt: {
					gte: new Date(),
				},
			},
		});
	}

	/**
		* Set the ban status of a user
		* @param {setUserBan} data The ban data
		* @returns The created ban record.
	*/
	async setBanStatus(data: setUserBan): Promise<UserBans> {
		return client.userBans.create({
			data: {
				expiresAt: data.expiresAt,
				reason: data.reason,
				user: {
					connect: {
						id: data.userId,
					},
				},
				issuedByUser: {
					connect: {
						id: data.issuedByUserId,
					},
				},
			},
		});
	}

	/**
		* Gets the number of admins
	*/
	async fetchAdminTotal() {
		try {
			const users = await client.user.groupBy({
				by: ['role'],
				_count: true,
			});

			return users.find(f => f.role == 'admin')?._count ?? 0;
		} catch (error) {
			throw error;
		}
	}

	/**
		* Fetch the count of each provider the users have logged / registered in using.
		* @returns An object of providers with values the number of users
	*/
	async fetchSignUpSource() {
		try {
			const result = await client.account.groupBy({
				by: ['providerId'],
				_count: true,
			});

			const providerCount: Record<string, number> = {};
			for (const row of result) {
				providerCount[row.providerId] = row._count;
			}

			return providerCount;
		} catch (error) {
			throw error;
		}
	}

	/**
		* Fetch the total size of all user's files.
		* @param {string} userId The ID of the user
		* @returns The total size of all files.
	*/
	async fetchUsersTotalFileSize(userId: string) {
		return client.file.aggregate({
			where: {
				userId,
			},
			_sum: {
				size: true,
			},
		});
	}

	/**
		* Fetch accounts by user ID
		* @param {string} userId The ID of the user
		* @returns The accounts associated with the user.
	*/
	async fetchAccountsByUserId(userId: string): Promise<Account[]> {
		return client.account.findMany({
			where: {
				userId,
			},
		});
	}

	/**
		* Fetch users by storage ID
		* @param {string} storageId The ID of the storage
		* @returns The users associated with the storage.
	*/
	async fetchByStorageId({ storageId, page = 0 }: fetchByStorageIdParams): Promise<User[]> {
		return client.user.findMany({
			where: {
				storageId,
			},
			take: 20,
			skip: page * 20,
		});
	}
}
