import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import { multiSessionClient } from 'better-auth/client/plugins';
import { auth } from './auth';
import { User } from '@/types';

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL,
	plugins: [
		inferAdditionalFields<typeof auth>(),
		multiSessionClient(),
	],
});

export const useTypedSession = () =>
	authClient.useSession<{user: User}>();

export const { signIn, signUp, useSession } = createAuthClient();