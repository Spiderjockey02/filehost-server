import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { FullSession } from '@/types/database/Session';
import type { AuthenticatedRequest } from '@/types';
import { IncomingHttpHeaders } from 'node:http';
import type Client from '@/helpers/Client';
import { CustomRequest } from '@/types';
import avatarForm from './avatar-form';
import parseForm from './parse-form';
import { Error } from '@/utils';

/**
  * Adapts a controller expecting an authenticated request to an Express handler.
  * @param handler Authenticated controller.
  * @returns {RequestHandler} Express-compatible handler.
*/
export function authenticatedHandler(handler: (req: AuthenticatedRequest, res: Response) => Promise<unknown>): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Authentication is enforced by the route middleware before this handler runs.
			await handler(req as AuthenticatedRequest, res);
		} catch (err) {
			next(err);
		}
	};
}

/**
  * Resolves the request's session and attaches it.
  * @param {Client} client Session lookup client.
  * @param {Request} req Incoming request.
  * @returns {Promise<CustomRequest>} Request with the session attached.
*/
export async function addSession(client: Client, req: Request): Promise<CustomRequest> {
	const newReq = req as CustomRequest;
	const session = await getSession(client, req.headers);
	newReq.session = session;
	return newReq;
}

/**
  * Fetches the valid session identified by the request headers' cookie.
  * @param client Session lookup client.
  * @param headers Request headers.
  * @returns {Promise<FullSession | null>} The session, null if missing.
*/
export async function getSession(client: Client, headers: IncomingHttpHeaders): Promise<FullSession | null> {
	const authName = process.env['NEXT_PUBLIC_COMPANY_NAME']?.replace(/\s+/g, '-') ?? '';

	// Get the session token from the cookies
	if (headers.cookie == undefined) return null;
	const cookies = headers['cookie'].split('; ');
	const parsedCookies = cookies.map((i: string) => i.split('='));
	const sessionToken = parsedCookies.find(i => [`${authName}.session_token`, `__Secure-${authName}.session_token`].includes(i[0]!))?.[1];
	if (!sessionToken) return null;

	// Fetch the session using the session token
	try {
		const token = await client.sessionManager.fetchByToken(sessionToken.split('.')[0]!);
		if (token == null) return null;

		// Check expire date
		if (token.expiresAt <= new Date()) return null;
		return token;
	} catch (err) {
		client.logger.error(err);
		return null;
	}
}

/**
  * Creates middleware that permits authenticated administrators.
  * @returns Middleware that rejects unauthenticated and non-admin requests.
*/
export async function checkAdmin(): Promise<(req: Request, res: Response, next: NextFunction) => Promise<void>> {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (req.session == null || req.session.user == null) {
			Error.InvalidSession(res);
			return;
		}

		if (req.session.user.role == 'admin') return next();
		Error.InvalidAccess(res);
		return;
	};
}

/**
  * Creates middleware that requires an authenticated user session.
  * @returns Middleware that rejects unauthenticated requests.
*/
export async function checkLoggedIn(): Promise<(req: Request, res: Response, next: NextFunction) => Promise<void>> {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (req.session == null || req.session.user == null) {
			Error.InvalidSession(res);
			return;
		}

		return next();
	};
}

export { avatarForm, parseForm };