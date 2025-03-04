import type { Request, Response, NextFunction } from 'express';
import { Error } from '../utils';
import avatarForm from './avatar-form';
import parseForm from './parse-form';
import { decode } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';

export async function getSession(req: Request): Promise<JWT | null> {
	if (req.headers.cookie == undefined) return null;

	// get Session token from cookies
	const cookies: string[] = req.headers['cookie'].split('; ');
	const parsedcookies = cookies.map((i: string) => i.split('='));

	// Get session token (Could be secure or not so check both)
	let sessionToken = parsedcookies.find(i => i[0] == '__Secure-next-auth.session-token')?.[1];
	if (sessionToken == null) sessionToken = parsedcookies.find(i => i[0] == 'next-auth.session-token')?.[1];
	if (!sessionToken) return null;

	try {
		const session = await decode({ token: sessionToken, secret: `${process.env.NEXTAUTH_SECRET}` });
		// Makes sure the token is valid
		if (session == null) return null;

		// Make sure the token hasn't expired
		if (session.exp <= (new Date().getTime() / 1000)) return null;

		return session;
	} catch (err) {
		console.log(err);
		return null;
	}
}

export async function checkAdmin(req: Request, res: Response, next: NextFunction) {
	const session = await getSession(req);
	if (session == null) return Error.InvalidSession(res);

	if (session.user?.group?.name == 'Admin') return next();
	return Error.InvalidSession(res);
}

export { avatarForm, parseForm };