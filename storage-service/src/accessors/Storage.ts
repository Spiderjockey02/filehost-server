import type { CreateMediumParams, StorageDirection, StorageWithCounts, UpdateMediumParams } from '@/types/database/StorageMedium';
import type { StorageMedium } from '@/types/generated/client';
import { skip } from '@prisma/client/runtime/client';
import { Pagination } from '@/types/database';
import { skipUndefined } from '@/utils';
import client from '.';

export default class StorageAccessor {
	// Don't need any special caching as it's a set number
	cache: Map<string, StorageWithCounts>;

	constructor() {
		this.cache = new Map();
	}

	/**
	 * Create a new storage medium.
	 * @param data The data to create a storage medium.
	 * @returns {StorageMedium} The created storage medium.
	 */
	async create(data: CreateMediumParams): Promise<StorageMedium> {
		try {
			const storage = await client.storageMedium.create({
				data: {
					type: data.type,
					name: data.name,
					basePath: data.basePath,
					location: data.location,
					endpoint: skipUndefined(data.endpoint),
					maxSize: skipUndefined(data.maxSize),
					usedSize: skipUndefined(data.usedSize),
					avatarOnly: skipUndefined(data.avatarOnly),
				},
				include: {
					_count: true,
				},
			});

			this.cache.set(storage.id, storage);
			return storage;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Update a storage medium.
	  * @param {updateStorageMedium} data The data to update the storage medium.
	  * @returns {StorageMedium} The updated storage medium.
	*/
	async update(data: UpdateMediumParams): Promise<StorageMedium> {
		try {
			const storage = await client.storageMedium.update({
				where: {
					id: data.id,
				},
				data: {
					name: skipUndefined(data.name),
					basePath: skipUndefined(data.basePath),
					location: skipUndefined(data.location),
					endpoint: skipUndefined(data.endpoint),
					maxSize: skipUndefined(data.maxSize),
					usedSize: skipUndefined(data.usedSize),
					avatarOnly: skipUndefined(data.avatarOnly),
				},
				include: {
					_count: true,
				},
			});
			this.cache.set(storage.id, storage);
			return storage;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Delete a storage medium.
	  * @param {string} storageId The Id for deletion
	  * @returns {StorageMedium} The deleted storage medium.
	*/
	async delete(storageId: string): Promise<StorageMedium> {
		return client.storageMedium.delete({
			where: {
				id: storageId,
			},
		});
	}

	/**
	  * Modify the storage size of a storage medium.
	  * @param {string} storageId The ID of the storage
	  * @param {bigint} size The size to modify the storage size by.
	  * @param {storageDirection} direction The direction to modify the storage size.
	  * @returns {StorageMedium} The updated storage.
	*/
	async modifyUsage(storageId: string, size: bigint, direction: StorageDirection): Promise<StorageMedium> {
		try {
			const storage = await client.storageMedium.update({
				where: {
					id: storageId,
				},
				data: {
					usedSize: {
						set: direction === 'SET' ? size : skip,
						decrement: direction === 'DECRE' ? size : skip,
						increment: direction === 'INCRE' ? size : skip,
					},
				},
				include: {
					_count: true,
				},
			});

			this.cache.set(storage.id, storage);
			return storage;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch a storage medium by its Id
	  * @param {string} id The storage medium Id.
		* @returns {StorageWithCounts | null} The storage medium.
	*/
	async fetchById(id: string): Promise<StorageWithCounts | null> {
		try {
			const storage = this.cache.get(id) ?? await client.storageMedium.findFirst({
				where: { id },
				include: {
					_count: true,
				},
			});

			if (storage !== null) this.cache.set(id, storage);
			return storage;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch avatar storage medium
		* @returns {StorageMedium | null} The storage medium.
	*/
	async fetchAvatarMedium(): Promise<StorageMedium | null> {
		try {
			const avatarMedium = this.cache.get('avatar')
				?? await client.storageMedium.findFirst({
					where: {
						avatarOnly: true,
					},
					include: {
						_count: true,
					},
				});

			if (avatarMedium !== null) this.cache.set('avatar', avatarMedium);
			return avatarMedium;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch all storage mediums
	  * @param {Pagination} data The pagination data.
		* @returns {StorageMedium[]} The storage mediums.
	*/
	async fetchAll({ page = 0 }: Pagination): Promise<StorageMedium[]> {
		return client.storageMedium.findMany({
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				_count: true,
			},
			take: 20,
			skip: page * 20,
		});
	}

	/**
	  * Fetch storage mediums by type
		* @returns {{ [key: string]: number }} Object with storage type as key and count as value.
	*/
	async fetchCountPerType(): Promise<{ [key: string]: number }> {
		try {
			const mediumTypes = await client.storageMedium.groupBy({
				by: ['type'],
				_count: true,
			});

			const typeWithCount: { [key: string]: number } = {};
			for (const item of mediumTypes) {
				typeWithCount[item.type] = item._count;
			}

			return typeWithCount;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch the count of storage mediums
		* @returns {number} The count of storage mediums.
	*/
	async fetchCount(): Promise<number> {
		return client.storageMedium.count();
	}

	/**
	  * Fetch average file count of all storage mediums
		* @returns {number} The average file count.
	*/
	async fetchAvgFileCount(): Promise<number> {
		try {
			let groups = await client.file.groupBy({
				by: ['storageId'],
				_count: true,
			});

			// Check to NOT include avatar Only and thumbnail Only storage mediums
			for (const group of groups) {
				const storage = await this.fetchById(group.storageId);
				if (storage?.avatarOnly) groups = groups.filter(g => g.storageId !== group.storageId);
			}

			// Now calculate average
			return groups.map(g => g._count).reduce((a, b) => a + b, 0) / groups.length;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch average storage usage of all storage mediums
		* @returns {number} The average storage usage.
	*/
	async fetchAvgStorageUsage(): Promise<number> {
		try {
			let groups = await client.file.groupBy({
				by: ['storageId'],
				_sum: {
					size: true,
				},
			});

			// Check to NOT include avatar Only and thumbnail Only storage mediums
			for (const group of groups) {
				const storage = await this.fetchById(group.storageId);
				if (storage?.avatarOnly) groups = groups.filter(g => g.storageId !== group.storageId);
			}

			// Now calculate average
			return groups.map(g => g._sum.size).reduce((a, b) => Number(a) + Number(b), 0) / groups.length;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch global storage usage
		* @returns The global storage usage.
	*/
	async fetchGlobalUsage() {
		return client.storageMedium.aggregate({
			_sum: {
				usedSize: true,
			},
		});
	}
}