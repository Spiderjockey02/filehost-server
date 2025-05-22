import { PATHS, ipRegex, CONSTANTS } from './CONSTANTS';
import Logger from './Logger';
import Error from './Error';
import { readdirSync, statSync } from 'fs';
import { join, parse, sep } from 'path';
import type { NextFunction, Request, Response } from 'express';
import Client from 'src/helpers/Client';
import { createUserActivity } from '../accessors/UserActivity';
import { getSession } from '../middleware';
import { HTTPMethod } from '@prisma/client';

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

export function sanitiseObject(obj: any) {
	return JSON.parse(JSON.stringify(obj, (_, value) =>
		typeof value === 'bigint' ? Number(value) : value,
	));
}

export function getIP(req: Request) {
	if (req.headers) {
		// Standard headers used by Amazon EC2, Heroku, and others.
		if (ipRegex.test(req.headers['x-client-ip'] as string)) return req.headers['x-client-ip'];

		// CF-Connecting-IP - applied to every request to the origin. (Cloudflare)
		if (ipRegex.test(req.headers['cf-connecting-ip'] as string)) return req.headers['cf-connecting-ip'];

		// Fastly and Firebase hosting header (When forwared to cloud function)
		if (ipRegex.test(req.headers['fastly-client-ip'] as string)) return req.headers['fastly-client-ip'];

		// Akamai and Cloudflare: True-Client-IP.
		if (ipRegex.test(req.headers['true-client-ip'] as string)) return req.headers['true-client-ip'];

		// Default nginx proxy/fcgi; alternative to x-forwarded-for, used by some proxies.
		if (ipRegex.test(req.headers['x-real-ip'] as string)) return req.headers['x-real-ip'];

		// (Rackspace LB and Riverbed's Stingray)
		// http://www.rackspace.com/knowledge_center/article/controlling-access-to-linux-cloud-sites-based-on-the-client-ip-address
		// https://splash.riverbed.com/docs/DOC-1926
		if (ipRegex.test(req.headers['x-cluster-client-ip'] as string)) return req.headers['x-cluster-client-ip'];

		if (ipRegex.test(req.headers['x-forwarded-for'] as string)) return req.headers['x-forwarded-for'];

		if (ipRegex.test(req.headers['forwarded-for'] as string)) return req.headers['forwarded-for'];

		if (ipRegex.test(req.headers.forwarded as string)) return req.headers.forwarded;
	}

	// Remote address checks.
	if (req.socket && ipRegex.test(req.socket.remoteAddress as string)) return req.socket.remoteAddress;
	return req.ip;
}

export function normalizePath(path: string) {
	if (!path.startsWith('/')) {
		path = '/' + path;
	}
	if (!path.endsWith('/')) {
		path += '/';
	}
	return path;
}

export function parseMySQLConnectionString(connectionString: string) {
	const regex = /^mysql:\/\/([^:]+):([^/]+)@([^/:]+):(\d+)\/(.+)$/;
	const match = connectionString.match(regex);

	if (!match) throw 'Invalid MySQL connection string format';
	const [, username, password, host, port, database] = match;

	return {
		username,
		password,
		host,
		port: parseInt(port, 10),
		database,
	};
}

export function logUserActivity(client: Client) {
	return async (req: Request, res: Response, next: NextFunction) => {
		const startTime = Date.now();
		let incomingBytes = 0;
		let outgoingBytes = 0;
		const ipAddress = getIP(req);

		const contentType = req.headers['content-type'] || '';

		const measureRequest = !contentType.startsWith('multipart/form-data');
		if (measureRequest) {
			const originalPush = req.push;
			if (originalPush) {
				req.push = function(chunk, encoding) {
					if (chunk) {
						incomingBytes += Buffer.byteLength(chunk, encoding);
					}
					return originalPush.call(this, chunk, encoding);
				};
			}
		} else if (req.headers['content-length']) {
			incomingBytes = parseInt(req.headers['content-length'], 10);
		}

		const originalWrite = res.write.bind(res);
		res.write = ((chunk: any, encoding?: BufferEncoding, cb?: () => void): boolean => {
			if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
				outgoingBytes += Buffer.byteLength(chunk, encoding);
			}
			return originalWrite(chunk, encoding as any, cb);
		}) as typeof res.write;

		const originalEnd = res.end.bind(res);
		res.end = ((chunk?: any, encoding?: any, cb?: any): any => {
			if (chunk && (typeof chunk === 'string' || Buffer.isBuffer(chunk))) {
				outgoingBytes += Buffer.byteLength(chunk, encoding);
			}

			res.once('finish', async () => {
				const durationMs = Date.now() - startTime;

				const session = await getSession(client, req);
				const userAgent = req.headers['user-agent'] || null;

				try {
					await createUserActivity({
						userId: session?.userId,
						method: req.method as HTTPMethod,
						endpoint: req.originalUrl,
						statusCode: res.statusCode,
						incomingBytes,
						outgoingBytes,
						ipAddress: `${ipAddress}`,
						userAgent: `${userAgent}`,
						durationMs,
					});
				} catch (err) {
					console.error('Failed to log user activity:', err);
				}
			});

			return originalEnd(chunk, encoding, cb);
		});

		next();
	};
};


export { PATHS, ipRegex, Logger, Error, CONSTANTS };