import client from './prisma';
import { Logger } from '../utils';

interface GetUsers {
	group?: boolean
	recent?: boolean
	delete?: boolean
	analyse?: boolean
}

export async function fetchAllUsers(data: GetUsers = {}) {
	Logger.debug('[DATABASE] Fetched all users.');
	return client.user.findMany({
		include: {
			group: data.group,
			recentFiles: data.recent,
			deleteFiles: data.delete,
			AnalysedFiles: data.analyse,
		},
	});
}

type fetchUserbyParam = {
	email?: string
	id?: string
}

// Find a user by email (for login)
export function	fetchUserbyParam(data: fetchUserbyParam) {
	Logger.debug(`[DATABASE] Fetched user by: ${data.id ?? data.email}`);
	return client.user.findUnique({
		where: {
			email: data.email,
			id: data.id,
		},
		include: {
			recentFiles: true,
			group: true,
			Notifications: true,
		},
	});
}


interface createUser {
	email: string
	name: string
	password: string
}
// Create a user
export async function createUser(data: createUser) {
	Logger.debug(`[DATABASE] Created new user: ${data.name}.`);
	return client.user.create({
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
	});
}

interface updateUser {
	id: string
	password?: string
	email?: string
	totalStorageSize?: string
}

export async function updateUser(data: updateUser) {
	Logger.debug(`[DATABASE] Updated new user: ${data.id}.`);
	return client.user.update({
		where: {
			id: data.id,
		},
		data: {
			password: data.password,
			email: data.email,
			totalStorageSize: data.totalStorageSize,
		},
	});
}

interface UserToGroupProps {
	userId: string
	groupId: string
}

export async function addUserToGroup(data: UserToGroupProps) {
	Logger.debug(`[DATABASE] Added user ${data.userId} to group: ${data.groupId}.`);
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
