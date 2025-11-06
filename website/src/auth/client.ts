import { inferAdditionalFields, organizationClient, adminClient, customSessionClient, twoFactorClient, lastLoginMethodClient } from 'better-auth/client/plugins';
import { stripeClient } from '@better-auth/stripe/client';
import { createAuthClient } from 'better-auth/react';
import { auth } from './server';

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL,
	plugins: [
		adminClient(),
		organizationClient(),
		inferAdditionalFields<typeof auth>(),
		customSessionClient<typeof auth>(),
		stripeClient({
			subscription: true,
		}),
		twoFactorClient(),
		lastLoginMethodClient(),
	],
});

export const { signIn, signUp, useSession } = createAuthClient();