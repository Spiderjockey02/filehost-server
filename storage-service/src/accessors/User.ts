import client from './prisma';
import { GetUsers, fetchUserbyParam, createUser, updateUser, UserToGroupProps } from '../types/database/User';
import { LRUCache } from 'lru-cache';
import { UserWithGroup } from 'src/types/database/User';

export default class UserManager {
	cache: LRUCache<string, UserWithGroup>;

	constructor() {
		this.cache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});
	}

	async create(data: createUser) {
		const user = await client.user.create({
			data: {
				email: data.email,
				name: data.name,
				password: data.password,
				group: {
					connect: {
						name: 'Free',
					},
				},
			},
			include: {
				group: true,
			},
		});
		this.cache.set(user.id, user);
		return user;
	}

	async update(data: updateUser) {
		const user = await client.user.update({
			where: {
				id: data.id,
			},
			data: {
				password: data.password,
				email: data.email,
				totalStorageSize: data.totalStorageSize,
			},
			include: {
				group: true,
			},
		});
		this.cache.set(user.id, user);
		return user;
	}

	async fetchAll(data: GetUsers = {}) {
		return client.user.findMany({
			include: {
				group: data.group,
				recentFiles: data.recent,
				deleteFiles: data.delete,
				AnalysedFiles: data.analyse,
			},
		});
	}

	async addUserToGroup(data: UserToGroupProps) {
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
		});
	}

	async fetchbyParam(data: fetchUserbyParam): Promise<UserWithGroup | null> {
		let user = this.cache.find(u => u.id === data.id || u.email === data.email) ?? null;
		if (user == null) {
			user = await client.user.findUnique({
				where: {
					email: data.email,
					id: data.id,
				},
				include: {
					group: true,
				},
			});
		}
		return user;
	}
}