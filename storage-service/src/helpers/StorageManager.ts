import StorageAccessor from '../accessors/Storage';
import FileSystemManager from './SystemManagers/FileSystem';
import { StorageMedium } from '@prisma/client';
import S3Manager from './SystemManagers/S3';
import Client from './Client';
import { StorageProvider } from 'src/types';

export default class StorageManager extends StorageAccessor {
	client: Client;
	mediums: Map<string, StorageProvider>;

	constructor(client: Client) {
		super();
		this.client = client;
		this.mediums = new Map();
	}

	/**
	 * Gets the storage medium
	 * @param {StorageMedium} storage
	 * @returns {StorageProvider}
	 */
	async getProvider(storage: StorageMedium): Promise<StorageProvider> {
		let medium = this.mediums.get(storage.id) ?? null;
		if (medium !== null) return medium;

		switch (storage?.type) {
			case 'FILE_SYSTEM': {
				medium = new FileSystemManager(this.client, storage.basePath);
				this.mediums.set(storage.id, medium);
				await medium.verifyConnection();
				return medium;
			}
			case 'S3': {
				medium = new S3Manager(this.client, `${storage.endpoint}`);
				this.mediums.set(storage.id, medium);
				await medium.verifyConnection();
				return medium;
			}
			default:
				throw new Error(`Unsupported storage type: ${storage?.type}`);
		}
	}

	async getProviderById(storageId: string): Promise<StorageProvider> {
		const storage = await this.fetchById(storageId);
		if (storage == null) throw 'Storage is missing';

		return this.getProvider(storage);
	}
}