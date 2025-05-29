import { StorageMedium } from '@prisma/client';
import client from './prisma';
import { createStorageMedium } from 'src/types/database/StorageMedium';

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

	async fetchAll() {
		return client.storageMedium.findMany();
	}

	async fetchCount() {
		return client.storageMedium.count();
	}
}

