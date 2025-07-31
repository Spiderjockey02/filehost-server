import StorageAccessor from '../accessors/Storage';
import FileSystemManager from './SystemManagers/FileSystem';
import { StorageMedium, File } from '@prisma/client';
import S3Manager from './SystemManagers/S3';
import Client from './Client';
import { StorageProvider } from 'src/types';
import { S3ServiceException } from '@aws-sdk/client-s3';

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

	/**
	  * Gets the storage medium by its Id
	  * @param {string} storageId
	  * @returns {StorageProvider}
	*/
	async getProviderById(storageId: string): Promise<StorageProvider> {
		const storage = await this.fetchById(storageId);
		if (storage == null) throw 'Storage is missing';

		return this.getProvider(storage);
	}

	/**
	  * Migrate a user to a new storage medium
	  * @param {Client} client The instantiating client
	  * @param {File[]} files Array of all user's files
	  * @param {string} newStorageId The Id of the storage where files will be moved to
	  * @param {StorageProvider} newProvider The provider handler to move files
	*/
	async migrateUser(client: Client, files: File[], newStorageId: string, newProvider: StorageProvider) {
		for (const file of files) {
			try {
				// Fetch the provider the file is currently stored and verify it's online
				const oldProvider = await client.FileManager.storageManager.getProviderById(file.storageId);
				const isOldProviderOnline = await oldProvider.verifyConnection();
				if (!isOldProviderOnline) {
					client.logger.error('Storage medium is not online');
					break;
				}

				// Allow up to 3 attempts to move the file
				const retryLimit = 3;
				let wasSuccessfull = false;
				for (let i = 0; i < retryLimit; i++) {
					// Fetch the file and write it to the new storage medium
					const buffer = await oldProvider.readFileFromSystem(file).catch((err) => {
						if (err instanceof S3ServiceException) {
							if (err.$metadata.httpStatusCode == 404) {
								client.logger.error(`${file.id} was not found on the storage medium, ignoring it.`);
							}
						} else if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
							client.logger.error(`${file.id} was not found on the storage medium, ignoring it.`);
						}
						throw err;
					});

					// Write the file to the new medium and check the buffer to ensure it wrote correctly
					await newProvider.writeFileToSystem(`${file.userId}/${file.id}`, buffer);
					const newBuffer = await newProvider.readFileFromSystem(file);
					if (buffer.equals(newBuffer)) {
						await client.FileManager.update({ id: file.id, storageId: newStorageId });
						await oldProvider.deleteFileOnSystem(`${file.userId}/${file.id}`);
						wasSuccessfull = true;
						break;
					} else {
						client.logger.error(`Integrity check failed for file ${file.id}`);
					}
				}
				if (!wasSuccessfull) client.logger.error(`All ${retryLimit} attempts failed for file ${file.id}`);
			} catch (err) {
				client.logger.error(err);
			}
		}

		await client.userManager.update({ id: files[0].userId, isMigrating: false });
	}
}