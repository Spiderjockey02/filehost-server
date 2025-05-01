import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession, organization, admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { betterAuth } from 'better-auth';
import client from './prisma';

export const auth = betterAuth({
	plugins: [
		admin(),
		nextCookies(),
		organization({
			allowUserToCreateOrganization: false,
		}),
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
				required: false,
				input: false,
				defaultValue: 0,
			},
			role: {
				type: 'string',
				required: false,
				input: false,
				defaultValue: 'user',
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