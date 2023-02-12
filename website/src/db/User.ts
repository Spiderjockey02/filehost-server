import client from './prisma';

type findUser = {
	email?: string
	id?: string
}

// Find a user by email (for login)
export function	findUser(data: findUser) {
	if (data.email) {
		return client.user.findUnique({
  		where: {
  			email: data.email,
  		},
			include: {
				recentFiles: true,
				group: true,
			},
  	});
	} else if (data.id) {
		return client.user.findUnique({
			where: {
				email: data.id,
			},
		});
	} else {
		return null;
	}
}

type createUser = {
	email: string
	name: string
	password: string
}

// Create a user
export function createUser(data: createUser) {
	return client.user.create({
		data: {
			email: data.email,
			name: data.name,
			password: data.password,
		},
	});
}

export function fetchAllUsers() {
	return client.user.findMany();
}
