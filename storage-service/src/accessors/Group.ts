import client from './prisma';
import type { IdParam } from '../types';

interface getGroupsInclude {
	count?: boolean
	users?: boolean
}

export async function fetchAllGroups(data: getGroupsInclude = {}) {
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
	maxStorageSize?: number
}

export async function createGroup(data: CreateGroupProps) {
	return client.group.create({
		data: {
			name: data.name,
			maxStorageSize: data.maxStorageSize,
		},
	});
}

export async function deleteGroup(data: IdParam) {
	return client.group.delete({
		where: {
			id: data.id,
		},
	});
}
