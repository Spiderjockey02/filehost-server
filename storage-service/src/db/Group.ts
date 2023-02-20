import client from './prisma';

export async function getGroups() {
	return client.group.findMany();
}

export async function getGroupsWithCount() {
	return client.group.findMany({
		include: {
			_count: true,
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
	maxStorageSize?: string
}

export async function createGroup(data: CreateGroupProps) {
	return client.group.create({
		data: {
			name: data.name,
			maxStorageSize: data.maxStorageSize,
		},
	});
}

interface DeleteGroupProps {
	id: string
}

export async function deleteGroup(data: DeleteGroupProps) {
	return client.group.delete({
		where: {
			id: data.id,
		},
	});
}
