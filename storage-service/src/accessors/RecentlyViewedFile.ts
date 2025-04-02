import type { CreateRecentlyViewedFile } from '../types/database/RecentlyViewedFile';
import { RecentlyViewedFile } from '@prisma/client';
import { LRUCache } from 'lru-cache';
import client from './prisma';

export default class RecentlyViewedFileManager {
	cache: LRUCache<string, RecentlyViewedFile[]>;

	constructor() {
		this.cache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});
	}

	/**
		* Gets all of the user's directories
		* @param {CreateRecentlyViewedFile} data The user Id.
		* @returns {RecentlyViewedFile[]} The files.
	*/
	async upsert(data: CreateRecentlyViewedFile): Promise<RecentlyViewedFile> {
		const history = await client.recentlyViewedFile.upsert({
			where: {
				fileId_userId: {
					fileId: data.fileId,
					userId: data.userId,
				},
			},
			update: {
				viewedAt: new Date(),
			},
			create: {
				file: {
					connect: {
						id: data.fileId,
					},
				},
				user: {
					connect: {
						id: data.userId,
					},
				},
			},
		});
		this.cache.delete(data.userId);
		return history;
	}

	/**
		* Gets a user's recently viewed files.
		* @param {string} userId The user Id.
		* @returns {RecentlyViewedFile[]} The files.
	*/
	async fetchUserLatest(userId: string): Promise<RecentlyViewedFile[]> {
		let history = this.cache.get(userId) ?? null;
		if (history) return history;

		// Fetch from database as it's not in cache
		history = await client.recentlyViewedFile.findMany({
			where: { userId },
			orderBy: { viewedAt: 'desc' },
			include: { file: true },
		});

		this.cache.set(userId, history);
		return history;
	}

	/**
		* Delete a viewed file log
		* @param {string} userId The user Id.
		* @param {string} fileId The file Id.
		* @returns {RecentlyViewedFile} The file.
	*/
	delete(userId: string, fileId: string): Promise<RecentlyViewedFile> {
		return client.recentlyViewedFile.delete({
			where: {
				fileId_userId: {
					fileId,
					userId,
				},
			},
		});
	}
}