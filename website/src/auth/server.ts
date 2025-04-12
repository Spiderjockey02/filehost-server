import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { customSession } from 'better-auth/plugins';
import { multiSession } from 'better-auth/plugins';
import client from './prisma'

export const auth = betterAuth({
	plugins: [
		nextCookies(),
		multiSession(),
		customSession(async ({ user, session }) => {
			const updatedUser = await client.user.findUnique({
				where: {
					id: user.id,
				},
				include: {
					group: true,
					notifications: true,
				},
			});

			if (updatedUser == null) return { user: null, session: '' };

			// Check for group
			if (updatedUser?.groupId == null) {
				const group = await client.group.findFirst({
					where: {
						name: 'Free',
					},
				});
				if (group) {
					await client.user.update({
						where: {
							id: updatedUser.id,
						},
						data: {
							group: {
								connect: {
									id: group.id,
								},
							},
						},
					});
					updatedUser.group = group;
					updatedUser.groupId = group.id;
				}
			}

			return {
				user: {
					...updatedUser,
				},
				session,
			};
		}),
	],
	database: prismaAdapter(client, {
		provider: 'mysql',
	}),
	emailAndPassword: {
		enabled: true,
	},
	user: {
		changeEmail: {
			enabled: true,
		},
		additionalFields: {
			totalStorageSize: {
				type: 'number',
				required: true,
			},
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
});