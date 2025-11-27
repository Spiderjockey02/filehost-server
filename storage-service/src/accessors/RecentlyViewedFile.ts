import type { CreateRecentlyViewedFile, fetchUserLatestProps } from '@/types/database/RecentlyViewedFile';
import type { FullRecentlyViewedFile } from '@/types/database/RecentlyViewedFile';
import type { RecentlyViewedFile } from '@/types/generated/client';
import { LRUCache } from 'lru-cache';
import client from './prisma';

export default class RecentlyViewedFileManager {
	cache: LRUCache<string, FullRecentlyViewedFile[]>;

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
		} catch (error) {
			throw error;
		}
	}

	/**
		* Gets a user's recently viewed files.
		* @param {string} userId The user Id.
		* @returns {RecentlyViewedFile[]} The files.
	*/
	async fetchUserLatest({ userId, sortBy = 'viewedAt', sortOrder = 'desc' }: fetchUserLatestProps): Promise<FullRecentlyViewedFile[]> {
		try {
			let history = this.cache.get(userId) ?? null;
			const sortFn = (a: FullRecentlyViewedFile, b: FullRecentlyViewedFile) => {
				let valA: number | string = '';
				let valB: number | string = '';

				if (sortBy === 'viewedAt') {
					valA = new Date(a.viewedAt).getTime();
					valB = new Date(b.viewedAt).getTime();
				} else if (sortBy === 'name') {
					valA = a.file?.name?.toLowerCase() ?? '';
					valB = b.file?.name?.toLowerCase() ?? '';
				}

				if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
				if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
				return 0;
			};

			// Send cached history with correct sorting
			if (history) return [...history].filter(h => h.file?.deletedAt === null).sort(sortFn);

			// Fetch from database as it's not in cache
			history = await client.recentlyViewedFile.findMany({
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
			});

			this.cache.set(userId, history);
			return history;
		} catch (error) {
			throw error;
		}
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