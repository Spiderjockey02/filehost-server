import type { Request, Response, NextFunction } from 'express';
import { ipv4Regex } from '../utils/CONSTANTS';
import axios from 'axios';
import config from '../config';
import { getServerSession } from 'next-auth/next';
import type { Session } from '../types';
import type { NextAuthOptions } from 'next-auth';
type LabelEnum = { [key: string]: Session }
const sessionStore: LabelEnum = {};
import avatarForm from './avatar-form';
import parseForm from './parse-form';

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

export async function getSession(req: Request, res?: Response): Promise<Session | null> {
	if (req.headers.cookie == undefined) return null;

	const options: NextAuthOptions = {
		providers: [],
		session: {
			strategy: 'jwt',
			maxAge: 30 * 24 * 60 * 60,
		},
		secret: 'JHLSDHLFSFDSDIUBFSL UBLSIUF RI7B34L7I46B7IBLI7BBG7OIWBV74IV7BI64VB74647B3VB7346VB4376V4B7W6',
	};
	if (res) {
		const s = await getServerSession(req, res, options);
		console.log(req.headers);
		console.log('asdsad', s);
	}


	// Check if data is from cache
	if (sessionStore[req.headers.cookie]) {
		console.log('HIT CACHE');
		const session = sessionStore[req.headers.cookie];
		// Make sure it hasn't expired
		if (new Date(session.expires ?? 0).getTime() <= new Date().getTime()) return session;
	}

	// Fetch from front-end
	console.log('NOT HIT CACHE');
	const { data } = await axios.get(`${config.frontendURL}/api/auth/session`, {
		headers: { cookie: req.headers.cookie },
	});
	sessionStore[req.headers.cookie] = data;
	return data;
}

export async function checkAdmin(req: Request, res: Response, next: NextFunction) {
	const session = await getSession(req, res);
	if (session == null) return res.status(401).json({ error: 'You are not authorised to access this endpoint' });

	console.log(session.user);
	if(session.user?.group?.name == 'Admin') return next();
	res.status(401).json({ error: 'You are not authorised to access this endpoint' });
}
