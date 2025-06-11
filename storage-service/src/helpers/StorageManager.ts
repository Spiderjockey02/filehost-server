import StorageAccessor from '../accessors/Storage';
import FileSystemManager from './SystemManagers/FileSystem';
import { StorageMedium } from '@prisma/client';
import S3Manager from './SystemManagers/S3';
import Client from './Client';

export default class StorageManager extends StorageAccessor {
	client: Client;

	constructor(client: Client) {
		super();
		this.client = client;
	}

	getProvider(storage: StorageMedium) {
		switch (storage?.type) {
			case 'FILE_SYSTEM': {
				const system = new FileSystemManager(this.client, storage.basePath);
				system.verifyConnection();
				return system;
			}
			case 'S3': {
				const system = new S3Manager(this.client, `${storage.endpoint}`);
				system.verifyConnection();
				return system;
			}
			default:
				throw new Error(`Unsupported storage type: ${storage?.type}`);
		}
	}

	async getProviderById(storageId: string) {
		const storage = await this.fetchById(storageId);
		if (storage == null) throw 'Storage is missing';

		return this.getProvider(storage);
	}
}