import { StorageMedium } from '@prisma/client';
import client from './prisma';
import { createStorageMedium, updateStorageMedium } from 'src/types/database/StorageMedium';
import { storageDirection } from 'src/types/database/User';

export default class StorageAccessor {
	// Don't need any special caching as it's a set number
	cache: Map<string, StorageMedium>;

	constructor() {
		this.cache = new Map();
	}

	async create(data: createStorageMedium) {
		return client.storageMedium.create({
			data,
		});
	}

	update(data: updateStorageMedium) {
		return client.storageMedium.update({
			where: {
				id: data.id,
			},
			data,
		});
	}

	/**
	  * Modify the storage size of a storage medium.
	  * @param {string} storageId The ID of the storage
	  * @param {bigint} size The size to modify the storage size by.
	  * @param {storageDirection} direction The direction to modify the storage size.
	  * @returns The updated storage.
	*/
	async modifyUsage(storageId: string, size: bigint, direction: storageDirection) {
		return client.storageMedium.update({
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
		});
	}

	async fetchById(id: string) {
		let storage = this.cache.get(id) ?? null;
		if (storage !== null) return storage;

		// Fetch from database
		storage = await client.storageMedium.findUnique({
			where: { id },
		});

		if (storage !== null) this.cache.set(id, storage);
		return storage;
	}

	async fetchByName(name: string) {
		let storage = [...this.cache.values()].find(s => s.name == name) ?? null;
		if (storage !== null) return storage;

		storage = await client.storageMedium.findFirst({
			where: {
				name,
			},
		});

		if (storage !== null) this.cache.set(storage.id, storage);
		return storage;
	}

	async fetchAvatarMedium() {
		return client.storageMedium.findFirst({
			where: {
				avatarOnly: true,
			},
		});
	}

	async fetchThumbnailMedium() {
		return client.storageMedium.findFirst({
			where: {
				thumbnailOnly: true,
			},
		});
	}

	async fetchAll() {
		return client.storageMedium.findMany({
			include: {
				users: true,
			},
		});
	}

	async fetchCountPerType() {
		const accounts = await client.storageMedium.findMany();

		const mediumType: Record<string, number> = {};
		for (const account of accounts) {
			const type = account.type!;
			mediumType[type] = (mediumType[type] || 0) + 1;
		}

		return mediumType;
	}

	async fetchCount() {
		return client.storageMedium.count();
	}
}

