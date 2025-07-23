import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getSession } from '.';
import Client from 'src/helpers/Client';

export const userPostLimiter = new RateLimiterMemory({
	keyPrefix: 'post',
	points: 1,
	duration: 1,
	blockDuration: 0,
});

export async function userPostRateLimit(client: Client) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const path = req.originalUrl.split('?')[0];
			const userId = await getSession(client, req.headers);
			const key = `user:${userId}:${path}`;

			await userPostLimiter.consume(key);
			next();
		} catch {
			res.status(429).json({
				error: 'Too many requests. Please wait a second and try again.',
			});
		}
	};
}
