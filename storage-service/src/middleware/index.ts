import type { Request, Response, NextFunction } from 'express';
import extendedClient from '../accessors/prisma';
import avatarForm from './avatar-form';
import parseForm from './parse-form';
import { Error } from '../utils';

export async function getSession(req: Request) {
	if (req.headers.cookie == undefined) return null;

	// get Session token from cookies
	const cookies: string[] = req.headers['cookie'].split('; ');
	const parsedcookies = cookies.map((i: string) => i.split('='));

	// Get session token (Could be secure or not so check both)
	const sessionToken = parsedcookies.find(i => i[0] == 'better-auth.session_token')?.[1];
	if (!sessionToken) return null;

	try {
		const session = await extendedClient.session.findUnique({
			where: {
				token: sessionToken.split('.')[0],
			},
			include: {
				user: {
					include: {
						group: true,
					},
				},
			},
		});
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