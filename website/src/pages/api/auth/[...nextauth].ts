import NextAuth from 'next-auth';
// import FacebookProvider from 'next-auth/providers/facebook';
// import TwitterProvider from 'next-auth/providers/twitter';
// import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../db/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import config from '../../../config';

export const AuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		CredentialsProvider({
			id: 'credentials',
			name: 'credentials',
			credentials: {
				email: { label: 'email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;
				const resp = await fetch(`${config.url}/api/auth/login`, {
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
				return (data.success) ? data.user : null;
			},
		}),
	],
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60,
	},
	secret: process.env.NEXTAUTH_SECRET,
};


export default async function auth(req: NextApiRequest, res: NextApiResponse) {
	return NextAuth(req, res, {
		adapter: PrismaAdapter(prisma),
		providers: [
			CredentialsProvider({
				id: 'credentials',
				name: 'credentials',
				credentials: {
					email: { label: 'email', type: 'email' },
					password: { label: 'Password', type: 'password' },
				},
				async authorize(credentials) {
					if (!credentials?.email || !credentials?.password) return null;
					const resp = await fetch(`${config.url}/api/auth/login`, {
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
					token.user = user;
				}
				return token;
			},
			session({ session, token }) {
				if (token.user !== null) {
					session.user = token.user;
				}
				return session;
			},
			async redirect({ url, baseUrl }) {
				return url.startsWith(baseUrl)
					? Promise.resolve(url)
					: Promise.resolve(baseUrl);
			},
		},
		theme: {
			colorScheme: 'auto',
			brandColor: '',
			logo: '/vercel.svg',
		},
		// Enable debug messages in the console if you are having problems
		pages: {
			signIn: '/login',
		},
		debug: process.env.NODE_ENV === 'development',
	});
}
