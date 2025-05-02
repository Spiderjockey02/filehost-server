import type { GetUsers, fetchUserbyParam, updateUser, UserToGroupProps, FullUser, storageDirection } from '../types/database/User';
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
		const user = await client.user.update({
			where: {
				id: data.id,
			},
			data: {
				email: data.email,
				totalStorageSize: data.totalStorageSize,
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
	async fetchAll(data: GetUsers = {}): Promise<FullUser[]> {
		return client.user.findMany({
			include: {
				group: data.group,
				notifications: true,
			},
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
		let user = this.cache.find(u => u.id === data.id || u.email === data.email) ?? null;
		if (user == null) {
			user = await client.user.findUnique({
				where: {
					email: data.email,
					id: data.id,
				},
				include: {
					group: true,
					notifications: true,
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
					updatedAt: {
						// Fetch users that have been updated in the last week
						gte: last7days,
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
				createdAt:{
					gte: oldDate,
					lte: newDate,
				},
			},
		});
	}
}
