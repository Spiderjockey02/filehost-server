import { Request, Response, NextFunction } from 'express';
import Client from 'src/helpers/Client';
import { Error, getIP } from '../utils';
import { getSession } from '.';

interface Bucket {
  tokens: number;
  lastRefill: number;
  abuseLog: number[];
	lastAbuseLog?: number;
}

const buckets: Map<string, Bucket> = new Map();
export async function userPostRateLimit(client: Client) {
	return async (req: Request, res: Response, next: NextFunction) => {
		// Make sure the request isn't for content
		if (req.path.startsWith('/thumbnail/') || req.path.startsWith('/content/')) return next();

		// Make sure not to include upload endpoint
		if (req.path == '/api/files/upload') return next();

		// Get the client key and bucket
		const session = await getSession(client, req.headers);
		const key = session?.userId || getIP(req);
		const now = Date.now();
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = { tokens: client.config.get('RATE_LIMIT.CAPACITY'), lastRefill: now, abuseLog: [] };
			buckets.set(key, bucket);
		}

		const elapsed = (now - bucket.lastRefill) / 1000;
		if (elapsed > 0) {
			const refill = elapsed * client.config.get('RATE_LIMIT.REFILL_RATE');
			bucket.tokens = Math.min(client.config.get('RATE_LIMIT.CAPACITY'), bucket.tokens + refill);
			bucket.lastRefill = now;
		}

		bucket.abuseLog.push(now);
		bucket.abuseLog = bucket.abuseLog.filter((t) => now - t < client.config.get('RATE_LIMIT.ABUSE_WINDOW'));
		if (bucket.abuseLog.length > client.config.get('RATE_LIMIT.ABUSE_THRESHOLD')) {
			if (!bucket.lastAbuseLog || now - bucket.lastAbuseLog >= 1000) {
				bucket.abuseLog.push(now);
				bucket.lastAbuseLog = now;
				client.logger.warn(`⚠️ Abuse detected for key=${key}: ${bucket.abuseLog.length} req/s`);

				client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
					await client.AuditLogManager.create({
						eventName: 'RATE_LIMIT_ABUSE',
						resourceType: 'USER',
						resourceId: key,
						ip: getIP(req),
						userAgent: req.headers['user-agent'] || '',
						success: true,
						message: `Rate limit abuse detected: ${bucket.abuseLog.length} req/s`,
					});
				});
			}
		}

		if (bucket.tokens >= 1) {
			bucket.tokens -= 1;

			res.setHeader('X-RateLimit-Limit', client.config.get('RATE_LIMIT.CAPACITY').toString());
			res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
			res.setHeader('X-RateLimit-Reset', ((client.config.get('RATE_LIMIT.CAPACITY') - bucket.tokens) / client.config.get('RATE_LIMIT.REFILL_RATE')).toFixed(1));
			return next();
		}

		res.setHeader('X-RateLimit-Limit', client.config.get('RATE_LIMIT.CAPACITY').toString());
		res.setHeader('X-RateLimit-Remaining', '0');
		res.setHeader('X-RateLimit-Reset', ((client.config.get('RATE_LIMIT.CAPACITY') - bucket.tokens) / client.config.get('RATE_LIMIT.REFILL_RATE')).toFixed(1));
		res.setHeader('Retry-After', '1');
		Error.RateLimited(res);
	};
}