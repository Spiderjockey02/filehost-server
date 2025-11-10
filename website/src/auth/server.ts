import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession, organization, admin, twoFactor, lastLoginMethod, createAuthMiddleware } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { betterAuth } from 'better-auth';
import client from './prisma';
import { APIError } from 'better-auth/api';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-10-29.clover',
});

export const auth = betterAuth({
	appName: process.env.NEXT_PUBLIC_COMPANY_NAME,
	plugins: [
		lastLoginMethod(),
		twoFactor(),
		stripe({
			stripeClient,
			stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
			createCustomerOnSignUp: true,
			subscription: {
				enabled: true,
				plans: async () => {
					const plans = await client.plan.findMany();
					return plans.map(plan => ({
						name: plan.name,
						priceId: plan.priceId!,
					}));
				},
			},
			// Log stripe webhooks
			async onEvent(event) {
				console.log(event);
			},
		}),
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
			console.log(`Password for user ${user.email} has been reset.`);
			try {
				await Promise.all([
					client.auditLog.create({
						data: {
							event: {
								connectOrCreate: {
									where: {
										name: 'USER_PASSWORD_RESET',
									},
									create: {
										name: 'USER_PASSWORD_RESET',
										resourceType: 'USER',
										displayName: 'User Password Reset',
									},
								},
							},
							resourceId: user.id,
							user: {
								connect: {
									id: user.id,
								},
							},
							success: true,
						},
					}),
					client.notification.create({
						data: {
							text: 'Your password was successfully reset. If this wasn\'t you, please change your password immediately or contact support.',
							title: 'Password Reset Successful',
							user: {
								connect: {
									id: user.id,
								},
							},
						},
					}),
				]);
			} catch (err) {
				console.log(err);
			}
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
					try {
						await client.auditLog.create({
							data: {
								user: {
									connect: {
										id: user.id,
									},
								},
								event: {
									connectOrCreate: {
										where: {
											name: 'USER_REGISTERED',
										},
										create: {
											name: 'USER_REGISTERED',
											resourceType: 'SESSION',
											displayName: 'User Registered',
										},
									},
								},
								resourceId: user.id,
								userAgentCon: {
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
					} catch (err) {
						console.log(err);
					}
				},
			},
		},
		session: {
			create: {
				after: async (session, ctx) => {
					// If email is present then they are logging in via credentials, so check if they are 2FA
					if (ctx?.body.email) {
						const user = await client.user.findUnique({ where: { email: ctx?.body.email } });
						if (user?.twoFactorEnabled) return;
					}

					try {
						await client.auditLog.create({
							data: {
								user: {
									connect: {
										id: session.userId,
									},
								},
								event: {
									connectOrCreate: {
										where: {
											name: 'USER_LOGIN',
										},
										create: {
											name: 'USER_LOGIN',
											resourceType: 'SESSION',
											displayName: 'User Login',
										},
									},
								},
								resourceId: session.id,
								userAgentCon: {
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
					} catch (err) {
						console.log(err);
					}
				},
			},
		},
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			const userAgent = ctx.request?.headers.get('user-agent') || '';
			const ipAddress = ctx.request?.headers.get('x-forwarded-for') || '';

			const createAuditLog = async (message: string, userEmail?: string) => {
				try {
					await client.auditLog.create({
						data: {
							...(userEmail
								? {
									user: {
										connect: { email: userEmail },
									},
						  }
								: {}),
							event: {
								connectOrCreate: {
									where: { name: 'USER_LOGIN' },
									create: {
										name: 'USER_LOGIN',
										resourceType: 'SESSION',
										displayName: 'User Login',
									},
								},
							},
							userAgentCon: {
								connectOrCreate: {
									where: { agent: userAgent },
									create: { agent: userAgent },
								},
							},
							ipCon: {
								connectOrCreate: {
									where: { ip: ipAddress },
									create: { ip: ipAddress },
								},
							},
							message,
							success: false,
						},
					});
				} catch (err) {
					console.error('Audit log creation failed:', err);
				}
			};

			// Get error code
			if (!(ctx.context.returned instanceof APIError)) return;
			const code = ctx.context.returned.body?.code;

			switch (ctx.path) {
				case '/sign-in/email':
					if (code === 'INVALID_EMAIL_OR_PASSWORD') {
						await createAuditLog('Failed login attempt due to invalid password.', ctx.body?.email);
					} else if (code === 'INVALID_EMAIL') {
						await createAuditLog('Failed login attempt due to invalid email.');
					}
					break;
				case '/two-factor/verify-totp':
					if (code === 'INVALID_CODE') await createAuditLog('Failed login attempt due to invalid 2FA code.');
					break;
			}
		}),
	},
});