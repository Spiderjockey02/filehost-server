import client from './prisma';
import { Logger } from '../utils/Logger';
import type { IdParam } from '../types';

interface getGroupsInclude {
	count?: boolean
	users?: boolean
}

export async function fetchAllGroups(data: getGroupsInclude = {}) {
	Logger.debug('[DATABASE] Fetched all groups.');
	return client.group.findMany({
		include: {
			_count: data.count,
			users: data.users,
		},
	});
}

interface GroupNameProps {
	name: string
	includeUsers?: boolean
}

export async function getGroupByName(data: GroupNameProps) {
	Logger.debug(`[DATABASE] Fetched group with name: ${data.name}.`);
	return client.group.findUnique({
		where: {
			name: data.name,
		},
		include: {
			users: data.includeUsers ?? false,
		},
	});
}

interface CreateGroupProps {
	name: string
	maxStorageSize?: string
}

export async function createGroup(data: CreateGroupProps) {
	Logger.debug(`[DATABASE] Created new group: ${data.name}.`);
	return client.group.create({
		data: {
			name: data.name,
			maxStorageSize: data.maxStorageSize,
		},
	});
}

export async function deleteGroup(data: IdParam) {
	Logger.debug(`[DATABASE] Deleted group: ${data.id}.`);
	return client.group.delete({
		where: {
			id: data.id,
		},
	});
}
