import type { Request, Response, NextFunction } from 'express';
import { ipv4Regex } from '../utils/CONSTANTS';
import config from '../config';
type LabelEnum = { [key: string]: JWT }
const sessionStore: LabelEnum = {};
import avatarForm from './avatar-form';
import parseForm from './parse-form';
import { decode } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';
export { avatarForm, parseForm };

export function getIP(req: Request) {
	if (req.headers) {
		// Standard headers used by Amazon EC2, Heroku, and others.
		if (ipv4Regex.test(req.headers['x-client-ip'] as string)) return req.headers['x-client-ip'];

		// CF-Connecting-IP - applied to every request to the origin. (Cloudflare)
		if (ipv4Regex.test(req.headers['cf-connecting-ip'] as string)) return req.headers['cf-connecting-ip'];

		// Fastly and Firebase hosting header (When forwared to cloud function)
		if (ipv4Regex.test(req.headers['fastly-client-ip'] as string)) return req.headers['fastly-client-ip'];

		// Akamai and Cloudflare: True-Client-IP.
		if (ipv4Regex.test(req.headers['true-client-ip'] as string)) return req.headers['true-client-ip'];

		// Default nginx proxy/fcgi; alternative to x-forwarded-for, used by some proxies.
		if (ipv4Regex.test(req.headers['x-real-ip'] as string)) return req.headers['x-real-ip'];

		// (Rackspace LB and Riverbed's Stingray)
		// http://www.rackspace.com/knowledge_center/article/controlling-access-to-linux-cloud-sites-based-on-the-client-ip-address
		// https://splash.riverbed.com/docs/DOC-1926
		if (ipv4Regex.test(req.headers['x-cluster-client-ip'] as string)) return req.headers['x-cluster-client-ip'];

		if (ipv4Regex.test(req.headers['x-forwarded'] as string)) return req.headers['x-forwarded'];

		if (ipv4Regex.test(req.headers['forwarded-for'] as string)) return req.headers['forwarded-for'];

		if (ipv4Regex.test(req.headers.forwarded as string)) return req.headers.forwarded;
	}

	// Remote address checks.
	if (req.socket && ipv4Regex.test(req.socket.remoteAddress as string)) return req.socket.remoteAddress;
	return req.ip;
}

export async function getSession(req: Request): Promise<JWT | null> {
	if (req.headers.cookie == undefined) return null;

	// get Session token from cookies
	const cookies: string[] = req.headers['cookie'].split('; ');
	const parsedcookies = cookies.map((i: string) => i.split('='));
	const sessionToken = parsedcookies.find(i => i[0] == 'next-auth.session-token')?.[1];
	if (!sessionToken) return null;

	// Check session from cache
	let session;
	if (sessionStore[sessionToken]) {
		console.log('HIT CACHE');
		session = sessionStore[req.headers.cookie];
		// Make sure it hasn't expired
		if (new Date(session.exp).getTime() <= new Date().getTime()) return session;
	} else {
		console.log('NOT FROM CACHE');
		session = await decode({ token: sessionToken, secret: config.NEXTAUTH_SECRET });
		if (session == null) return null;
		sessionStore[sessionToken] = session;
	}

	return session;
}

export async function checkAdmin(req: Request, res: Response, next: NextFunction) {
	const session = await getSession(req);
	if (session == null) return res.status(401).json({ error: 'You are not authorised to access this endpoint' });

	console.log(session.user);
	if(session.user?.group?.name == 'Admin') return next();
	res.status(401).json({ error: 'You are not authorised to access this endpoint' });
}
