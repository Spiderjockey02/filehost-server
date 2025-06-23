import type { Request, Response, NextFunction } from 'express';
import avatarForm from './avatar-form';
import parseForm from './parse-form';
import { Error } from '../utils';
import Client from 'src/helpers/Client';
import { IncomingHttpHeaders } from 'node:http';

export async function getSession(client: Client, headers: IncomingHttpHeaders) {
	if (headers.cookie == undefined) return null;

	// get Session token from cookies
	const cookies = headers['cookie'].split('; ');
	const parsedcookies = cookies.map((i: string) => i.split('='));

	// Get session token (Could be secure or not so check both)
	const sessionToken = parsedcookies.find(i => i[0] == 'better-auth.session_token')?.[1];
	if (!sessionToken) return null;

	try {
		const session = await client.sessionManager.fetchByToken(sessionToken.split('.')[0]);
		return session;
	} catch (err) {
		console.log(err);
		return null;
	}
}

export async function checkAdmin(client: Client) {
	return async (req: Request, res: Response, next: NextFunction) => {
		const session = await getSession(client, req.headers);
		if (session == null) return Error.InvalidSession(res);

		if (session.user.role == 'admin') return next();
		return Error.InvalidAccess(res);
	};
}

export { avatarForm, parseForm };