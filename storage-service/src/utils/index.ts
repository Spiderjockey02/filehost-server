import { PATHS, ipRegex } from './CONSTANTS';
import Logger from './Logger';
import Error from './Error';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, parse, sep } from 'path';
import type { NextFunction, Request, Response } from 'express';
import Client from 'src/helpers/Client';
import { getSession } from '../middleware';
import { HTTPMethod } from '@prisma/client';
import { FileOptions, MySQLConnectionOptions, S3Options } from 'src/types';
import { AsnResponse, CityResponse, Reader } from 'mmdb-lib';
import { UAParser } from 'ua-parser-js';

// Setup MaxMind GeoIP
const db = readFileSync('./assets/GeoLite2-City.mmdb');
const db2 = readFileSync('./assets/GeoLite2-ASN.mmdb');
const cityReader = new Reader<CityResponse>(db);
const asnReader = new Reader<AsnResponse>(db2);

/**
  * Parses an IP address using MaxMind GeoIP databases.
  * @param {string} ip - The IP address to parse.
*/
export function parseIP(ip: string) {
	const city = cityReader.get(ip);
	const asn = asnReader.get(ip);

	return {
		country: city?.country?.names.en || '',
		city: city?.city?.names.en || '',
		latitude: city?.location?.latitude || 0,
		longitude: city?.location?.longitude || 0,
		isp: asn?.autonomous_system_organization || '',
		isVPN: false,
		isCrawler: false,
	};
}

/**
  * Parses a user agent string using UAParser.
  * @param {string} userAgent - The raw user agent string.
*/
export function parseUserAgent(userAgent: string) {
	const parsed = new UAParser(userAgent);

	return {
		browserName: parsed.getBrowser().name || '',
		browserVersion: parsed.getBrowser().version || '',
		osName: parsed.getOS().name || '',
		osVersion: parsed.getOS().version || '',
		isBot: false,
	};
}


/**
  * Generates route mappings from a given directory structure.
  * @param directory - The base directory to generate routes from.
*/
export function generateRoutes(directory: string) {
	const results: FileOptions[] = [];
	const baseName = directory.split(sep).pop() ?? '';

	for (const path of getFilesRecursively(directory)) {
		const { dir, name } = parse(path);
		const relativeDir = dir
			.slice(dir.indexOf(baseName))
			.split(sep)
			.join('/')
			.replace(baseName, baseName.startsWith('/') ? '/' : '');

		results.push({ path, route: `${relativeDir}/${name}` });
	}

	return results;
}

/**
  * Recursively walks a directory and returns a list of all file paths.
  * @param {string} directory The directory to search.
  * @param {string[]} files An array to accumulate file paths (used in recursion).
  * @returns {string[]} An array of file paths.
*/
export function getFilesRecursively(directory: string, files: string[] = []): string[] {
	for (const file of readdirSync(directory)) {
		const path = join(directory, file);
		const stats = statSync(path);
		if (stats.isFile()) {
			files.push(path);
		} else if (stats.isDirectory()) {
			getFilesRecursively(path, files);
		}
	}

	return files;
}

/**
  * Sanitizes an object by converting BigInt values to Numbers.
  * @param {unknown} obj The object to sanitize.
  * @returns {unknown} The sanitized object.
*/
export function sanitiseObject(obj: unknown): unknown {
	return JSON.parse(JSON.stringify(obj, (_, value) =>
		typeof value === 'bigint' ? value.toString() : value,
	));
}

/**
  * Retrieves the client's IP address from the request headers or socket.
  * @param {Request} req The incoming request object.
  * @returns {string} The client's IP address.
*/
export function getIP(req: Request): string {
	// Regular expression to validate IPv4 and IPv6 addresses
	const normalizeIP = (ip: string): string => {
		if (ip.startsWith('::ffff:')) return ip.substring(7);
		if (ip.startsWith('[') && ip.endsWith(']')) return ip.slice(1, -1);
		return ip;
	};

	if (req.headers) {
		const headerOrder = [
			'x-client-ip',
			'cf-connecting-ip',
			'fastly-client-ip',
			'true-client-ip',
			'x-real-ip',
			'x-cluster-client-ip',
			'x-forwarded-for',
			'forwarded-for',
			'forwarded',
		];

		for (const header of headerOrder) {
			const raw = req.headers[header];
			const value = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;

			if (!value) continue;
			const candidate = value.split(',')[0].trim();
			if (ipRegex.test(candidate)) return normalizeIP(candidate);
		}
	}

	// Remote address fallback
	const remote = req.socket?.remoteAddress;
	if (remote && ipRegex.test(remote)) return normalizeIP(remote);
	return normalizeIP(`${req.ip}`);
}

/**
  * Normalizes a file path to ensure it starts and ends with a slash.
  * @param {string} path The file path to normalize.
  * @returns {string} The normalized file path.
*/
export function normalizePath(path: string): string {
	if (!path || path == '/') return '/';

	// Convert backslashes to forward slashes and ensure single slashes at start and end
	const unixPath = path.replace(/\\/g, '/');
	return `/${unixPath.replace(/^\/+|\/+$/g, '')}/`;
}

/**
 * Parses a MySQL connection string into its components.
 * @param {string} connectionString mysql://username:password@host:port/database
 * @returns {MySQLConnectionOptions} An object containing the parsed components.
 */
export function parseMySQLConnectionString(connectionString: string): MySQLConnectionOptions {
	const regex = /^mysql:\/\/([^:]+):([^/]+)@([^/:]+):(\d+)\/(.+)$/;
	const match = connectionString.match(regex);

	if (!match) throw 'Invalid MySQL connection string format';
	const [, username, password, host, port, database] = match;
	return { username, password, host, database, port: parseInt(port, 10) };
}

/**
  * Parses an S3 URL into its components.
  * @param {string} s3Url The S3 URL to parse.
  * @returns {S3Options} An object containing the parsed components.
*/
export function parseS3Url(s3Url: string): S3Options {
	if (!s3Url.startsWith('s3://')) throw 'Invalid S3 URL';

	const parsed = new URL(`http://${s3Url.slice(5)}`);
	const accessKeyId = decodeURIComponent(parsed.username);
	const secretAccessKey = decodeURIComponent(parsed.password);
	const endpoint = `${parsed.protocol.slice(0, -1)}://${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`;
	const bucket = parsed.pathname.replace(/^\/+/, '').split('/')[0];
	const region = parsed.searchParams.get('region') ?? 'eu-west-1';

	return { endpoint, region, accessKeyId, secretAccessKey, bucket };
}

/**
  * Middleware to log user activity for each request.
  * @param {Client} client The client instance containing the userActivityManager.
  * @returns {Function} An Express middleware function.
*/
export function logUserActivity(client: Client): (req: Request, res: Response, next: NextFunction) => void {
	return (req: Request, res: Response, next: NextFunction) => {
		const startTime = Date.now();
		const { ['user-agent']: userAgent, ['content-type']: contentType, ['content-length']: contentLength } = req.headers;
		const isMultipart = contentType?.startsWith('multipart/form-data');

		const requestLine = `${req.method} ${req.originalUrl} HTTP/${req.httpVersion}\r\n`;
		const rawRequestHeaders = Object.entries(req.headers)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\r\n');
		const requestHeaderSize = Buffer.byteLength(requestLine + rawRequestHeaders + '\r\n\r\n');

		let requestBodySize = 0;

		if (!isMultipart) {
			req.on('data', chunk => {
				requestBodySize += Buffer.byteLength(chunk);
			});
		} else if (contentLength) {
			requestBodySize = parseInt(contentLength, 10);
		}

		const originalWrite = res.write.bind(res);
		const originalEnd = res.end.bind(res);

		let responseBodySize = 0;
		res.write = ((chunk: Buffer | string, encoding?: BufferEncoding, cb?: () => void): boolean => {
			if (chunk) responseBodySize += Buffer.byteLength(chunk, encoding);

			return originalWrite(chunk, encoding!, cb);
		}) as typeof res.write;

		res.end = ((chunk?: any, encoding?: any, cb?: () => void): Response => {
			if (chunk) responseBodySize += Buffer.byteLength(chunk, encoding);

			res.once('finish', () => {
				const statusLine = `HTTP/${req.httpVersion} ${res.statusCode} ${res.statusMessage ?? ''}\r\n`;
				const rawResponseHeaders = Object.entries(res.getHeaders())
					.map(([key, value]) => `${key}: ${value}`)
					.join('\r\n');
				const responseHeaderSize = Buffer.byteLength(statusLine + rawResponseHeaders + '\r\n\r\n');
				const totalRequestSize = requestHeaderSize + requestBodySize;
				const totalResponseSize = responseHeaderSize + responseBodySize;
				const durationMs = Date.now() - startTime;

				getSession(client, req.headers).then(session => {
					client.userActivityManager.add({
						userId: session?.userId ?? null,
						method: req.method as HTTPMethod,
						endpoint: req.originalUrl,
						statusCode: res.statusCode,
						incomingBytes: totalRequestSize,
						outgoingBytes: totalResponseSize,
						ipAddress: getIP(req),
						userAgent: `${userAgent}`,
						durationMs,
						createdAt: new Date(),
					});
				}).catch(client.logger.error);
			});

			return originalEnd(chunk, encoding, cb);
		});

		next();
	};
}

export { PATHS, ipRegex, Logger, Error };