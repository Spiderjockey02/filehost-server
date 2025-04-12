import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import { multiSessionClient } from 'better-auth/client/plugins';
import { auth } from './server';

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL,
	plugins: [
		inferAdditionalFields<typeof auth>(),
		multiSessionClient(),
	],
});

export const { signIn, signUp, useSession } = createAuthClient();