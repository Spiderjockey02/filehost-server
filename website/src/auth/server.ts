import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession, organization, admin, twoFactor } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { betterAuth } from 'better-auth';
import client from './prisma';
import { APIError } from 'better-auth/api';

export const auth = betterAuth({
	appName: process.env.NEXT_PUBLIC_COMPANY_NAME,
	plugins: [
		twoFactor(),
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
					plan: true,
					notifications: true,
				},
			});
			if (updatedUser == null) return { user: null, session: null };

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
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			console.log(user);
			console.log(url);
		},
		onPasswordReset: async ({ user }) => {
			// your logic here
			console.log(`Password for user ${user.email} has been reset.`);
		},
	},
	user: {
		changeEmail: {
			enabled: true,
		},
		additionalFields: {
			totalStorageSize: {
				type: 'number',
				required: true,
				input: false,
				defaultValue: 0,
			},
			role: {
				type: 'string',
				required: true,
				input: false,
				defaultValue: 'user',
			},
			storageId: {
				type: 'string',
				required: true,
				input: false,
				defaultValue: 'storageId',
			},
			planId: {
				type: 'string',
				required: true,
				input: false,
				defaultValue: 'planId',
			},
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['google', 'discord'],
		},
	},
	socialProviders: {
		discord: {
			clientId: process.env.DISCORD_CLIENT_ID as string,
			clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const storage = await client.storageMedium.findFirst({
						where: {
							avatarOnly: false,
							isPrivate: false,
						},
					});
					if (storage == null) throw new APIError('BAD_REQUEST', { message: 'Storage mediums have not been setup' });

					const plan = await client.plan.findFirst({
						where: {
							isDefault: true,
						},
					});
					if (plan == null) throw new APIError('BAD_REQUEST', {	message: 'Subscription plans have not been setup' });

					return {
						data: {
							...user,
							storageId: storage.id,
							planId: plan.id,
						},
					};
				},
				after: async (user, ctx) => {
					await client.auditLog.create({
						data: {
							user: {
								connect: {
									id: user.id,
								},
							},
							eventType: 'USER_REGISTERED',
							resourceType: 'USER',
							resourceId: user.id,
							UserAgentCon: {
								connectOrCreate: {
									where: {
										agent: ctx?.request?.headers.get('user-agent') || '',
									},
									create: {
										agent: ctx?.request?.headers.get('user-agent') || '',
									},
								},
							},
							ipCon: {
								connectOrCreate: {
									where: {
										ip: ctx?.request?.headers.get('x-forwarded-for') || '',
									},
									create: {
										ip: ctx?.request?.headers.get('x-forwarded-for') || '',
									},
								},
							},
							message: 'A new user has registered',
							success: true,
						},
					});
				},
			},
		},
		session: {
			create: {
				after: async (session, ctx) => {
					await client.auditLog.create({
						data: {
							user: {
								connect: {
									id: session.userId,
								},
							},
							eventType: 'USER_LOGIN',
							resourceType: 'USER',
							resourceId: session.id,
							UserAgentCon: {
								connectOrCreate: {
									where: {
										agent: ctx?.request?.headers.get('user-agent') || '',
									},
									create: {
										agent: ctx?.request?.headers.get('user-agent') || '',
									},
								},
							},
							ipCon: {
								connectOrCreate: {
									where: {
										ip: ctx?.request?.headers.get('x-forwarded-for') || '',
									},
									create: {
										ip: ctx?.request?.headers.get('x-forwarded-for') || '',
									},
								},
							},
							message: 'User has logged in',
							success: true,
						},
					});
				},
			},
		},
	},
});