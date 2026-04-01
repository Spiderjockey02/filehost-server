import type { FullSession } from '@/types/database/Session';
import type { Session } from '@/types/generated/client';
import { LRUCache } from 'lru-cache';
import client from '.';

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
	async fetchAll(userId?: string): Promise<Session[]> {
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
		try {
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
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch a session by ID
	  * @param {String} token The token
		* @returns {Session} The session
	*/
	async fetchByToken(token: string): Promise<FullSession | null> {
		try {
			const session = this.cache.get(token)
				?? await client.session.findUnique({
					where: {
						token,
					},
					include: {
						user: {
							include: {
								plan: true,
							},
						},
					},
				});

			if (session !== null) this.cache.set(token, session);
			return session;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Delete a session by token
	  * @param {String} token The token
		* @returns {Session} The deleted session
	*/
	async delete(token: string): Promise<Session> {
		try {
			const session = await client.session.delete({ where: {	token } });

			this.cache.delete(session.token);
			return session;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Delete expired sessions
		* @returns {{count: number}} Number of sessions deleted
	*/
	async deleteExpired(): Promise<{count: number}> {
		return client.session.deleteMany({
			where: {
				expiresAt: {
					lte: new Date(),
				},
			},
		});
	}
}