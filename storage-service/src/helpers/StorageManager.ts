import StorageAccessor from '../accessors/Storage';
import FileSystemManager from './SystemManagers/FileSystem';
import { StorageMedium } from '@prisma/client';
import S3Manager from './SystemManagers/S3';

export default class StorageManager extends StorageAccessor {
	constructor() {
		super();
	}

	getProvider(storage: StorageMedium) {
		switch (storage?.type) {
			case 'FILE_SYSTEM':
				return new FileSystemManager(storage.basePath);
			case 'S3':
				return new S3Manager(`${storage.endpoint}`);
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