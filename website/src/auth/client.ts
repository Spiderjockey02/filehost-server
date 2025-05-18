import { inferAdditionalFields, organizationClient, adminClient, customSessionClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { auth } from './server';

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL,
	plugins: [
		adminClient(),
		organizationClient(),
		inferAdditionalFields<typeof auth>(),
		customSessionClient<typeof auth>(),
	],
});

export const { signIn, signUp, useSession } = createAuthClient();