import type { Request } from 'express';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
const ipv4Regex = /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/;

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
	if (req.socket && ipv4Regex.test(req.socket.remoteAddress as string)) {
		return req.socket.remoteAddress;
	}

	return undefined;
}

export async function createThumbnail(path: string) {
	const thumbnail = await imageThumbnail(path, { responseType: 'buffer', width: 200, height: 250 });
	fs.writeFileSync(`${process.cwd()}/src/uploads/name.png`, thumbnail);

}
