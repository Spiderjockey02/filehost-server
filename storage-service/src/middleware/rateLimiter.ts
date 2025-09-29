import { createAuditLogEntry } from '../accessors/AuditLog';
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
const capacity = 50;
const refillRate = 1;
const abuseThreshold = 100;
const abuseWindow = 1000;

export async function userPostRateLimit(client: Client) {
	return async (req: Request, res: Response, next: NextFunction) => {
		// Get the client key and bucket
		const session = await getSession(client, req.headers);
		const key = session?.userId || getIP(req);
		const now = Date.now();
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = { tokens: capacity, lastRefill: now, abuseLog: [] };
			buckets.set(key, bucket);
		}

		const elapsed = (now - bucket.lastRefill) / 1000;
		if (elapsed > 0) {
			const refill = elapsed * refillRate;
			bucket.tokens = Math.min(capacity, bucket.tokens + refill);
			bucket.lastRefill = now;
		}

		bucket.abuseLog.push(now);
		bucket.abuseLog = bucket.abuseLog.filter((t) => now - t < abuseWindow);
		if (bucket.abuseLog.length > abuseThreshold) {
			if (!bucket.lastAbuseLog || now - bucket.lastAbuseLog >= 1000) {
				bucket.abuseLog.push(now);
				bucket.lastAbuseLog = now;
				client.logger.warn(`⚠️ Abuse detected for key=${key}: ${bucket.abuseLog.length} req/s`);

				client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
					await createAuditLogEntry({
						eventType: 'RATE_LIMIT_ABUSE',
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

			res.setHeader('X-RateLimit-Limit', capacity.toString());
			res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
			res.setHeader('X-RateLimit-Reset', ((capacity - bucket.tokens) / refillRate).toFixed(1));
			return next();
		}

		res.setHeader('X-RateLimit-Limit', capacity.toString());
		res.setHeader('X-RateLimit-Remaining', '0');
		res.setHeader('X-RateLimit-Reset', ((capacity - bucket.tokens) / refillRate).toFixed(1));
		res.setHeader('Retry-After', '1');
		Error.RateLimited(res);
	};
}