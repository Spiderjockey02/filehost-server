import type { CreateRecentlyViewedFile, fetchUserLatestProps } from '@/types/database/RecentlyViewedFile';
import type { FullRecentlyViewedFile } from '@/types/database/RecentlyViewedFile';
import type { RecentlyViewedFile } from '@/types/generated/client';
import { LRUCache } from 'lru-cache';
import client from '.';

export default class RecentlyViewedFileManager {
	cache: LRUCache<string, FullRecentlyViewedFile[]>;

	constructor() {
		this.cache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});
	}

	/**
		* Create or update an entry of recently viewed file
		* @param {CreateRecentlyViewedFile} data The recently viewed file data
		* @returns {RecentlyViewedFile} The recently viewed file.
	*/
	async upsert(data: CreateRecentlyViewedFile): Promise<RecentlyViewedFile> {
		try {
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
		} catch (err) {
			throw err;
		}
	}

	/**
		* Fetch a user's recently viewed files.
		* @param {fetchUserLatestProps} data The filter data
		* @returns {RecentlyViewedFile[]} The recently viewed files.
	*/
	async fetchUsersRecentlyViewed({ userId, sortBy = 'viewedAt', sortOrder = 'desc', page = 0 }: fetchUserLatestProps): Promise<FullRecentlyViewedFile[]> {
		try {
			// Fetch from database as it's not in cache
			const history = await client.recentlyViewedFile.findMany({
				where: { userId,
					file: { deletedAt: null },
				},
				orderBy: {
					viewedAt: sortBy == 'viewedAt' ? sortOrder : undefined,
					file: sortBy == 'name' ? {
						name: sortOrder,
					} : undefined,
				},
				include: { file: true },
				take: 20,
				skip: page * 20,
			});
			return history;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch a user's total viewed file count
	  * @param {string} userId The user Id
	  * @returns {number} Total count
	*/
	async fetchUsersTotalViewed(userId: string): Promise<number> {
		return client.recentlyViewedFile.count({
			where: {
				userId,
			},
		});
	}

	/**
		* Delete a viewed file log
		* @param {string} userId The user Id.
		* @param {string} fileId The file Id.
		* @returns {RecentlyViewedFile} The file.
	*/
	async delete(userId: string, fileId: string): Promise<RecentlyViewedFile> {
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