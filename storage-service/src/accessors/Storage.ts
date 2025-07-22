import { StorageMedium } from '@prisma/client';
import client from './prisma';
import { createStorageMedium, StorageWithCounts, updateStorageMedium } from 'src/types/database/StorageMedium';
import { Pagination } from 'src/types/database/File';
import { storageDirection } from 'src/types/database/User';

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
	async create(data: createStorageMedium): Promise<StorageMedium> {
		const storage = await client.storageMedium.create({
			data,
			include: {
				_count: true,
			},
		});

		this.cache.set(storage.id, storage);
		return storage;
	}

	/**
	  * Update a storage medium.
	  * @param {updateStorageMedium} data The data to update the storage medium.
	  * @returns {StorageMedium} The updated storage medium.
	*/
	async update(data: updateStorageMedium): Promise<StorageMedium> {
		const storage = await client.storageMedium.update({
			where: {
				id: data.id,
			},
			data,
			include: {
				_count: true,
			},
		});
		this.cache.set(storage.id, storage);
		return storage;
	}

	/**
	  * Modify the storage size of a storage medium.
	  * @param {string} storageId The ID of the storage
	  * @param {bigint} size The size to modify the storage size by.
	  * @param {storageDirection} direction The direction to modify the storage size.
	  * @returns The updated storage.
	*/
	async modifyUsage(storageId: string, size: bigint, direction: storageDirection) {
		const storage = await client.storageMedium.update({
			where: {
				id: storageId,
			},
			data: {
				usedSize: {
					set: direction === 'SET' ? size : undefined,
					decrement: direction === 'DECRE' ? size : undefined,
					increment: direction === 'INCRE' ? size : undefined,
				},
			},
			include: {
				_count: true,
			},
		});

		this.cache.set(storage.id, storage);
		return storage;
	}

	/**
	  * Fetch a storage medium by its Id
	  * @param {string} id The storage medium Id.
		* @returns {StorageWithCounts | null} The storage medium.
	*/
	async fetchById(id: string): Promise<StorageWithCounts | null> {
		let storage = this.cache.get(id) ?? null;
		if (storage !== null) return storage;

		storage = await client.storageMedium.findFirst({
			where: { id },
			include: {
				_count: true,
			},
		});

		if (storage !== null) this.cache.set(id, storage);
		return storage;
	}

	/**
	  * Fetch avatar storage medium
		* @returns {StorageMedium | null} The storage medium.
	*/
	async fetchAvatarMedium(): Promise<StorageMedium | null> {
		let avatarMedium = this.cache.get('avatar') ?? null;
		if (avatarMedium == null) {
			avatarMedium = await client.storageMedium.findFirst({
				where: {
					avatarOnly: true,
				},
				include: {
					_count: true,
				},
			});

			if (avatarMedium !== null) this.cache.set('avatar', avatarMedium);
		}

		return avatarMedium;
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
		const mediumTypes = await client.storageMedium.groupBy({
			by: ['type'],
			_count: true,
		});

		const typeWithCount: { [key: string]: number } = {};
		for (const item of mediumTypes) {
			typeWithCount[item.type] = item._count;
		}

		return typeWithCount;
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
	}

	/**
	  * Fetch average storage usage of all storage mediums
		* @returns {number} The average storage usage.
	*/
	async fetchAvgStorageUsage(): Promise<number> {
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