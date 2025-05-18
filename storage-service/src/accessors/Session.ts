import { FullSession } from 'src/types/database/Session';
import { Session } from '@prisma/client';
import client from './prisma';
import { LRUCache } from 'lru-cache';

export default class SessionManager {
	cache: LRUCache<string, FullSession>;

	constructor() {
		this.cache = new LRUCache({
			max: 100,
			// Only cache for 5 mins
			ttl: 1000 * 60 * 5,
		});
	}

	/**
	  * Fetch all sessions
	  * @param {String?} userId The user Id.
		* @returns {Session[]} The session
	*/
	fetchAll(userId?: string): Promise<Session[]> {
		return client.session.findMany({
			where: {
				userId,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	/**
	  * Fetch unique users who have logged in between two dates
	  * @param {Date} oldDate The old date
	  * @param {Date} newDate The new date
		* @returns {String[]} The array of user Ids
	*/
	async fetchUsersWhoLoggedInBetweenTwoDates(oldDate: Date, newDate: Date): Promise<string[]> {
		const sessions = await client.session.findMany({
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});

		const users = [...new Set(sessions.map(s => s.userId))];
		return users;
	}

	/**
	  * Fetch a session by ID
	  * @param {String} token The token
		* @returns {Session} The session
	*/
	async fetchByToken(token: string): Promise<FullSession | null> {
		let session = this.cache.get(token) ?? null;
		if (session == null) {
			session = await client.session.findUnique({
				where: {
					token,
				},
				include: {
					user: {
						include: {
							group: true,
						},
					},
				},
			});
			if (session !== null) this.cache.set(token, session);
		}

		return session;
	}

	/**
	  * Delete a session by token
	  * @param {String} token The token
		* @returns {Session} Whether it was deleted or not
	*/
	async delete(token: string): Promise<Session> {
		const session = await client.session.delete({
			where: {
				token,
			},
		});

		this.cache.delete(session.token);
		return session;
	}

	/**
	  * Delete expired sessions
	*/
	async deleteExpired() {
		return client.session.deleteMany({
			where: {
				expiresAt: {
					gte: new Date(),
				},
			},
		});
	}
}

