import type { CreateGroupProps, FullGroup, getGroupsInclude, GroupNameProps } from '../types/database/Group';
import type { IdParam } from '../types';
import { Group } from '@prisma/client';
import { LRUCache } from 'lru-cache';
import client from './prisma';

export default class GroupManager {
	cache: LRUCache<string, Group>;

	constructor() {
		this.cache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});
	}

	/**
	  * Creates a new group
	  * @param {CreateGroupProps} data The group data.
		* @returns {Group} The created group.
	*/
	async create(data: CreateGroupProps): Promise<Group> {
		const group = await client.group.create({
			data: {
				name: data.name,
				maxStorageSize: data.maxStorageSize,
			},
		});
		this.cache.set(group.name, group);
		return group;
	}

	/**
	  * Retrieves all groups
	  * @param {getGroupsInclude} data The group data.
		* @returns {Group[]} The groups.
	*/
	async fetchAll(data: getGroupsInclude = {}): Promise<FullGroup[]> {
		return client.group.findMany({
			include: {
				_count: data.count,
				users: data.users,
			},
		});
	}

	/**
	  * Retrieves a group by its name
	  * @param {GroupNameProps} data The group name.
		* @returns {Group | null} The group.
	*/
	async getByName(data: GroupNameProps): Promise<Group | null> {
		let group = this.cache.get(data.name) ?? null;
		if (group == null)	{
			group = await client.group.findUnique({
				where: {
					name: data.name,
				},
				include: {
					users: data.includeUsers,
				},
			});
			if (group != null) this.cache.set(group.name, group);
		}
		return group;
	}

	/**
	  * Deletes a group
	  * @param {IdParam} data The group ID.
		* @returns {Boolean} Whether the group was deleted.
	*/
	async delete(data: IdParam): Promise<boolean> {
		const group = await client.group.delete({
			where: {
				id: data.id,
			},
		});
		return this.cache.delete(group.name);
	}
}
