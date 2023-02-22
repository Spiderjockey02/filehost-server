import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextApiRequest, NextApiResponse } from 'next';
import config from '../../../config';
import type { User } from '../../../utils/types';
import type { AuthOptions } from 'next-auth';
import axios from 'axios';

export const AuthOption = {
	providers: [
		TwitterProvider({
			clientId: config.twitter.consumer_key,
			clientSecret: config.twitter.consumer_secret,
			version: '2.0',
		}),
		CredentialsProvider({
			id: 'credentials',
			name: 'credentials',
			credentials: {
				email: { label: 'email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;
				const resp = await fetch(`${config.backendURL}/api/auth/login`, {
					method: 'post',
					headers: {
						'content-type': 'application/json;charset=UTF-8',
					},
					body: JSON.stringify({
						password: credentials.password,
						email: credentials.email,
					}),
				});
				const data = await resp.json();
				console.log('data', data);
				return (data.success) ? data.user : null;
			},
		}),
	],
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60,
	},
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async jwt({ token, user }) {
			if (typeof user !== typeof undefined) {
				/*
				const r = await axios.post(`${config.backendURL}/api/auth/session/verify`, {
					data: {
						id: user?.id,
					},
				});
				*/
				token.user = user;
			}
			return token;
		},
		async session({ session, token }) {
			if (token.user !== null) {
				const { data } = await axios.post(`${config.backendURL}/api/auth/session/verify`, {
					data: {
						id: (token.user as User)?.id,
						token,
					},
				});
				session.user = data.user as User;
			}
			return session;
		},
		redirect: async ({ url, baseUrl }) =>	url.startsWith(baseUrl) ? Promise.resolve(url)	: Promise.resolve(baseUrl),
	},
	theme: {
		colorScheme: 'auto',
		brandColor: '',
		logo: '/vercel.svg',
	},
	pages: {
		signIn: '/login',
	},
	// Enable debug messages in the console if you are having problems
	debug: process.env.NODE_ENV === 'development',
} as AuthOptions;

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
	return NextAuth(req, res, AuthOption);
}
