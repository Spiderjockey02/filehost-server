import client from './prisma';

export async function getUsers() {
	return client.user.findMany();
}

interface createUser {
	email: string
	name: string
	password: string
}
// Create a user
export async function createUser(data: createUser) {
	return client.user.create({
		data: {
			email: data.email,
			name: data.name,
			password: data.password,
		},
	});
}

interface updatePassword {
	id: string
	password: string
}

export async function updateUserPassword(data: updatePassword) {
	return client.user.update({
		where: {
			id: data.id,
		},
		data: {
			password: data.password,
		},
	});
}

interface UserToGroupProps {
	userId: string
	groupId: string
}

export async function addUserToGroup(data: UserToGroupProps) {
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

interface getUserByIdProps {
	userId: string
}
export async function getUserById(data: getUserByIdProps) {
	return client.user.findUnique({
		where: {
			id: data.userId,
		},
		include: {
			group: true,
		},
	});
}
