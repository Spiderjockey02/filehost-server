import type { Request, Response, NextFunction } from 'express';
import avatarForm from './avatar-form';
import parseForm from './parse-form';
import { Error } from '../utils';
import Client from 'src/helpers/Client';
import { IncomingHttpHeaders } from 'node:http';
import { FullSession } from 'src/types/database/Session';

/**
  * Fetches the session from the request headers.
  * @param client - The Client instance
  * @param headers - The request headers
  * @return {Promise<Session | null>} - The session object or null if not found
*/
export async function getSession(client: Client, headers: IncomingHttpHeaders): Promise<FullSession | null> {
	// Get the session token from the cookies
	if (headers.cookie == undefined) return null;
	const cookies = headers['cookie'].split('; ');
	const parsedCookies = cookies.map((i: string) => i.split('='));
	const sessionToken = parsedCookies.find(i => i[0] == 'better-auth.session_token')?.[1];
	if (!sessionToken) return null;

	// Fetch the session using the session token
	try {
		return client.sessionManager.fetchByToken(sessionToken.split('.')[0]);
	} catch (err) {
		console.log(err);
		return null;
	}
}

/**
  * Middleware to check if the user is logged in and has the admin role.
  * @param client - The Client instance
  * @return {Promise<(req: Request, res: Response, next: NextFunction) => Promise<void>} - Calls next middleware if the user is logged in, otherwise sends an error response
*/
export async function checkAdmin(client: Client): Promise<(req: Request, res: Response, next: NextFunction) => Promise<void>> {
	return async (req: Request, res: Response, next: NextFunction) => {
		const session = await getSession(client, req.headers);
		if (session == null) {
			Error.InvalidSession(res);
			return;
		}

		if (session.user.role == 'admin') return next();
		Error.InvalidAccess(res);
		return;
	};
}

export { avatarForm, parseForm };