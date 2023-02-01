import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const client = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = client;

type findUser = {
	email?: string
	id?: string
}

// Find a user by email (for login)
export function	findUser(data: findUser) {
	return client.user.findUnique({
		where: {
			email: data.email,
		},
	});
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

export default client;
