import type { Request, Response, NextFunction } from 'express';
import imageThumbnail from 'image-thumbnail';
import fs, { readdirSync, statSync } from 'fs';
import { PATHS, ipv4Regex } from './CONSTANTS';
import { join, parse, sep } from 'path';
import { fetchUserbyParam } from '../db/User';
import axios from 'axios';
import type { Session } from '../types';

interface FileOptions {
	path: string,
	route: string,
}

export function generateRoutes(directory: string) {
	const seperator = '/';
	const results: FileOptions[] = [];
	for(const path of searchDirectory(directory)) {
		const { dir, name } = parse(path);
		const basePath = directory.split(sep).pop() as string;
		const dirIndex = dir.indexOf(basePath);
		const directoryRoute = dir.slice(dirIndex).split(sep).join(seperator).toString().replace(basePath, !basePath.startsWith(seperator) ? '' : seperator);
		results.push({ path, route: `${validateDynamicRoute(directoryRoute)}${validateDynamicRoute(name, true)}` });
	}
	return results;
}

export function validateDynamicRoute(context: string, isFile = false) {
	const seperator = '/';
	const dynamicRouteValidator = /(?<=\[).+?(?=\])/gi;
	const validate = (dynamicRouteValidator.exec(context));
	if(!validate) return isFile ? `${seperator}${context}` : context;
	return context.replace(`[${validate[0]}]`, isFile ? `${seperator}:${validate[0]}` : `:${validate[0]}`);
}

export function searchDirectory(directory: string, files: string[] = []) {
	for(const file of readdirSync(directory)) {
		const path = join(directory, file);
		const is = statSync(path);
		if(is.isFile()) files.push(path);
		if(is.isDirectory()) files = files.concat(searchDirectory(path));
	}
	return files;
}

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

export async function createThumbnail(userId: string, path: string) {
	console.log(`${PATHS.CONTENT}/${userId}/${path}`);
	// @ts-ignore
	const thumbnail = await imageThumbnail(`${PATHS.CONTENT}/${userId}/${path}`, { responseType: 'buffer', width: 200, height: 220, fit: 'cover' });
	fs.writeFileSync(`${PATHS.THUMBNAIL}/${userId}/${path.substring(0, path.lastIndexOf('.')) || path}.jpg`, thumbnail);
}

export async function checkAdmin(req: Request, res: Response, next: NextFunction) {
	const userId = req.body.userId;
	if (!userId) return res.status(401).json({ error: 'You are not authorised to access this endpoint' });
	const user = await fetchUserbyParam({ id: userId });

	if(user?.group?.name == 'Admin') return next();
	res.status(401).json({ error: 'You are not authorised to access this endpoint' });
}

export async function getSession(req: Request): Promise<Session> {
	const { data } = await axios.get('http://192.168.0.14:3000/api/auth/session', {
		headers: { cookie: req.headers.cookie },
	});

	return data;
}
