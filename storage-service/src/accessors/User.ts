import client from './prisma';
import { GetUsers, fetchUserbyParam, updateUser, UserToGroupProps } from '../types/database/User';
import { LRUCache } from 'lru-cache';
import { FullUser } from 'src/types/database/User';

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
	  * Fetch the total count of users
		* @returns {number} The total count of users.
	*/
	async fetchTotal(): Promise<number> {
		return client.user.count();
	}
}