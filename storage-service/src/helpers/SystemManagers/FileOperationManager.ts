import { FileType, type File, type User } from '@/types/generated/client';
import type { UserWithPlan } from '@/types/database/User';
import ThumbnailCreator from '@/media/ThumbnailCreator';
import { S3ServiceException } from '@aws-sdk/client-s3';
import type { FullFile } from '@/types/database/File';
import type StorageManager from './StorageManager';
import { Archiver, ZipArchive } from 'archiver';
import type { StorageProvider } from '@/types';
import { FileAccessor } from '@/accessors';
import TrashHandler from '../TrashHandler';
import { sanitiseObject } from '@/utils';
import type { Response } from 'express';
import Client from '../Client';

export default class FileManager extends FileAccessor {
	TrashHandler: TrashHandler;
	client: Client;
	storageManager: StorageManager;
	ThumbnailCreator: ThumbnailCreator;

	constructor(client: Client, storageManager: StorageManager) {
		super();
		this.TrashHandler = new TrashHandler(client);
		this.client = client;
		this.storageManager = storageManager;
		this.ThumbnailCreator = new ThumbnailCreator(this);
	}

	/**
	  * Retrieves the files in a directory
	  * @param {User} user The user.
	  * @param {string} fileId file path of the directory.
	*/
	async getDirectory(user: User, fileId: string) {
		let directory: FullFile | null = null;
		if (fileId == '') {
			directory = await this.fetchRoot(user.id);
		} else {
			directory = await this.fetchById(fileId);
			if (directory?.userId !== user.id) throw new Error('No access');
		}

		// Double check it's not deleted
		if (directory?.deletedAt !== null) throw new Error('Directory not found');
		return sanitiseObject(directory);
	}

	/**
	  * Deletes a file
	  * @param {UserWithPlan} user The user.
	  * @param {string} fileId file path of the file.
		* @returns {File} The deleted file
	*/
	async delete(user: UserWithPlan, fileId: string): Promise<File> {
		return this.TrashHandler.moveToTrash(user, fileId);
	}

	/**
	  * Moves a file to a new directory
	  * @param {User} user The user.
	  * @param {string} fileId The file's ID that is being moved
		* @param {string} newDirId The new directory ID, the file is moving into
	*/
	async move(user: User, fileId: string, newDirId: string) {
		// First Make sure they are not the same IDs
		if (fileId === newDirId) throw new Error('Cannot move a file into itself.');

		// Fetch the files from the database
		const [oldFile, newDir] = await Promise.all([this.fetchById(fileId), this.fetchById(newDirId)]);
		if (oldFile == null) throw new Error('File not found');
		if (newDir == null || newDir.type !== FileType.DIRECTORY) throw new Error('Directory not found');

		// Check the owner of the file and folder
		if (oldFile.userId !== user.id || newDir.userId !== user.id) throw new Error('You do not have permission to move this file.');

		// Make sure a file with the potential same name doesn't already exist
		if (newDir.children.find(f => f.name == oldFile.name)) throw new Error('A file with that name already exists in the same directory.');

		// Update the old parent directory
		const oldParent = await this.fetchById(oldFile.parentId);
		if (oldParent !== null) this.cache.delete(oldFile.id);

		await this.update({ id: oldFile.id, parentId: newDir.id });

		// If it's a folder, process its children (don't move the folder itself again)
		if (oldFile.type === FileType.DIRECTORY) {
			const children = await this.fetchChildrenByParentId(oldFile.id);

			// Check if the folder is empty
			if (children.length > 0) {
				// Move all child files/subfolders
				for (const child of children) {
					await this.move(user, child.id, oldFile.id);
				}
			}
		}
	}

	/**
	  * Rename a file
	  * @param {User} user The user.
	  * @param {string} fileId The file's ID that is being renamed
		* @param {string} newName The new name for the file
		* @returns {FullFile} The new file
	*/
	async rename(user: User, fileId: string, newName: string): Promise<FullFile> {
		const file = await this.fetchById(fileId);
		if (file == null) throw new Error('File not found');

		// Check the owner of the file
		if (file.userId !== user.id) throw new Error('You do not have permission to rename this file.');

		// Make sure the new name doesn't have any invalid characters in it
		if (this.client.config.get('INVALID_CHARS_IN_FILE_NAME').some(c => newName.includes(c))) throw new Error('File name includes invalid characters.');

		// Makes sure the new name is less than the max characters
		if (newName.length > this.client.config.get('MAX_CHARS_FILE_NAME')) throw `New name must be less than ${this.client.config.get('MAX_CHARS_FILE_NAME')} characters.`;

		// Make sure a file with the potential same name doesn't already exist
		const parentDir = await this.fetchById(file.parentId);
		if (parentDir && parentDir.children.find(f => f.name == newName)) throw new Error('A file with that name already exists in the same directory.');

		// Will update to also support their children for path to be updated aswell (when it's a directory)
		return this.update({ id: file.id, name: newName });
	}

	/**
	  * Rename a bulk list of files
	  * @param {User} user The user.
	  * @param {object} data The file's ID and their new name
	*/
	async renameBulk(user: User, data: {fileId: string, newName: string}[]) {
		// Validate files
		const files = await Promise.all(data.map(async (f) => await this.fetchById(f.fileId)));
		if (files.filter(f => f == null).length != files.length) throw new Error('Contains invalid files.');
		if (files.some(f => f?.userId !== user.id)) throw new Error('Contains files you dont own.');

		try {
			await this.renameBulk(user, data);
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	  * Copies a file
	  * @param {User} user The user's ID.
	  * @param {string} fileId The file / directory that will be copied
		* @param {string} newDirId The directory the file / directory will be copied into
	*/
	async copy(user: User, fileId: string, newDirId: string) {
		const file = await this.fetchById(fileId);
		const newDir = await this.fetchById(newDirId);
		if (file == null) throw new Error('File not found');
		if (newDir == null || newDir.type !== 'DIRECTORY') throw new Error('Directory not found');

		// Check the owner of the files
		if (file.userId !== user.id || newDir.userId !== user.id) throw new Error('You do not have permission to move this file.');

		// Delete the new file's cache
		this.cache.delete(file.id);

		// If the old file is a directory, copy the directory and its contents recursively
		if (file.type === 'DIRECTORY') {
			await this._copyDirectory(file, newDir);
		} else {
			await this._copyFile(file, newDir);
		}
	}

	/**
	  * Creates a directory
	  * @param {User} user The user's ID.
	  * @param {string} parentId file path of the directory.
		* @param {string} folderName The name of the folder.
	*/
	async createDirectory(user: User, parentId: string, folderName: string) {
		// Check if the folder name is longer than max chars
		if (folderName.length > this.client.config.get('MAX_CHARS_FILE_NAME')) throw new Error(`Folder name must be less than ${this.client.config.get('MAX_CHARS_FILE_NAME')} characters.`);

		// Make sure the new name doesn't have any invalid characters in it
		if (this.client.config.get('INVALID_CHARS_IN_FILE_NAME').some(c => folderName.includes(c))) throw new Error('Folder name includes invalid characters.');

		// Fetch the parent directory
		const parentDir = await this.fetchById(parentId);
		if (parentDir == null || parentDir.type !== 'DIRECTORY') throw new Error('Directory not found');

		// Check the owner of the file
		if (parentDir?.userId !== user.id) throw new Error('You do not have permission to rename this file.');

		// Update the parent directory to include the new folder
		await this.update({
			id: parentDir.id,
			children: {
				userId: user.id,
				name: folderName,
				size: BigInt(this.client.config.get('FOLDER_SIZE')),
				type: 'DIRECTORY',
				mimetype: null,
				storageId: user.storageId,
			},
		});
	}

	/**
	  * Copies a file directly
	  * @param {FullFile} file file path of the directory.
		* @param {FullFile} newDir The name of the folder, that file is moving into.
	*/
	private async _copyFile(file: FullFile, newDir: FullFile) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(file.storageId);
		if (storage == null) throw new Error('Storage not found');
		const fileProvider = await this.storageManager.getProvider(storage);

		// Check if file already exists in the target directory
		if (newDir.children.find(f => f.name == file.name)) throw new Error('A file with that name already exists in the same directory.');

		// Create the new file entry in the database
		let newFile: FullFile | null = null;
		try {
			newFile = await this.create({
				name: file.name,
				size: file.size,
				userId: file.userId,
				type: file.type,
				parentId: newDir.id,
				mimetype: file.mimetype,
				storageId: file.storageId,
			});

			// Copy the actual file contents
			await fileProvider.copyFile(`${file.userId}/${file.id}`, `${file.userId}/${newFile.id}`);
		} catch (err) {
			if (newFile?.id) await this.deleteFromDB(newFile.id);
			throw err;
		}
	}

	/**
	  * Copies a directory directly
	  * @param {File} oldDir file path of the directory.
		* @param {File} newDir The folder where oldDir is going in
	*/
	private async _copyDirectory(oldDir: FullFile, newDir: FullFile) {
		if (newDir.children.find(f => f.name == oldDir.name)) throw new Error('A file with that name already exists in the same directory.');

		// Create the new directory, but ensure the path doesn't include the old folder name twice
		const newFolder = await this.create({
			name: oldDir.name,
			size: BigInt(this.client.config.get('FOLDER_SIZE')),
			userId: oldDir.userId,
			type: 'DIRECTORY',
			parentId: newDir.id,
			mimetype: null,
			storageId: oldDir.storageId,
		});

		// Recursively copy files and subdirectories inside this folder
		const children = await this.fetchChildrenByParentId(oldDir.id);

		for (const child of children) {
			if (child.type === 'DIRECTORY') {
				// If it's a folder, copy it recursively
				await this._copyDirectory(child, newFolder);
			} else {
				// If it's a file, copy it
				await this._copyFile(child, newFolder);
			}
		}
	}

	/**
	  * Download a single file
	  * @param {Response} res The response to pipe files to
	  * @param {User} user The user who requested the download.
	  * @param {File} file The file to download
	*/
	async downloadFile(res: Response, user: User, file: FullFile) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw new Error('Storage not found');
		const fileProvider = await this.storageManager.getProvider(storage);

		// Download the file
		if (file.type == 'DIRECTORY') {
			const archive = new ZipArchive({ zlib: { level: 9 } });
			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
			archive.pipe(res);

			// Now loop and get the children's files
			for (const child of file.children) {
				if (child.type == 'DIRECTORY') {
					const newFile = await this.fetchById(child.id);
					if (newFile) await this.traverseFilesForDownloading(archive, newFile, fileProvider);
				} else {
					archive.append(await fileProvider.readFile(child), { name: child.name });
				}
			}

			await archive.finalize();
		} else {
			fileProvider.downloadFile(res, file);
		}
	}

	private async traverseFilesForDownloading(archive: Archiver, file: FullFile, fileProvider: StorageProvider) {
		for (const child of file.children) {
			if (child.type == 'DIRECTORY') {
				const newFile = await this.fetchById(child.id);
				if (newFile) await this.traverseFilesForDownloading(archive, newFile, fileProvider);
			} else {
				archive.append(await fileProvider.readFile(child), { name: child.name });
			}
		}

		return archive;
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The user's ID.
	  * @param {User} user The user's ID.
	  * @param {File[]} files The user's ID.
	*/
	async downloadFiles(res: Response, user: User, files: File[]) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw new Error('Storage not found');
		const fileProvider = await this.storageManager.getProvider(storage);

		// Download the file
		return fileProvider.downloadFiles(res, files);
	}

	/**
	  * Send a file to the user.
	  * @param {Response} res The HTTP response object.
		* @param {File} file The file to send.
	*/
	async sendFile(res: Response, user: User, file: File, range?: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw new Error('Storage not found');

		// Fetch the storage medium and check it's online
		const storageProvider = await this.storageManager.getProviderById(file.storageId);
		if (storageProvider.isOnline == false) throw new Error('Storage medium is offline');

		// Download the file
		return storageProvider.sendFile(res, file, range);
	}

	/**
	  * Delete user's avatar (If there is one).
	  * @param {string} userId The user's ID.
	*/
	async deleteAvatar(userId: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchAvatarMedium();
		if (storage == null) throw new Error('Storage not found');
		const fileProvider = await this.storageManager.getProvider(storage);
		fileProvider.deleteFile(`${userId}.webp`);
	}

	/**
	  * Send the user's avatar.
		* @param {Response} res The HTTP response object.
	  * @param {string} userId The user's ID.
	*/
	async sendAvatar(res: Response, userId: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchAvatarMedium();
		if (storage == null) throw new Error('Storage not found');
		const fileProvider = await this.storageManager.getProvider(storage);

		const hasCustomAvatar = await fileProvider.checkFileExists(`${userId}.webp`);
		const file = { userId: '', mimetype: 'image/webp', id: hasCustomAvatar ? `${userId}.webp` : 'default-avatar.webp' } as File;
		fileProvider.sendFile(res, file);
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The HTTP response object.
	  * @param {string} fileId The filepath of the file for the thumbnail
	*/
	async sendThumbnail(res: Response, fileId: string) {
		// Fetch the file
		const file = await this.fetchById(fileId);
		if (file == null || file.mimetype == null || file.deletedAt !== null) {
			res.setHeader('Cache-Control', 'public, max-age=86400');
			return res.sendFile(`${process.cwd()}/assets/missing-file-icon.png`);
		}

		// Fetch the storage provider and check if it is online
		const storageProvider = await this.storageManager.getProviderById(file.storageId);
		if (!storageProvider.isOnline) {
			res.setHeader('Cache-Control', 'public, max-age=86400');
			return res.sendFile(`${process.cwd()}/assets/missing-file-icon.png`);
		}

		// Build the thumbnail
		const thumbnail = { ...file, id: `thumbnails/${file.id}.${this.ThumbnailCreator.fileExtension}` };
		try {
			res.setHeader('Cache-Control', 'public, max-age=21600');
			res.setHeader('Last-Modified', file.updatedAt.toUTCString());

			const ims = res.req.headers['if-modified-since'];
			if (ims && new Date(ims).getTime() >= file.updatedAt.getTime()) return res.status(304).end();
			await storageProvider.sendFile(res, thumbnail);
			return;
		} catch (err) {
			const isNotFound = (err instanceof S3ServiceException &&	err.$metadata?.httpStatusCode === 404) || (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT');
			if (!isNotFound) {
				res.setHeader('Cache-Control', 'public, max-age=86400');
				return res.sendFile(`${process.cwd()}/assets/missing-file-icon.png`);
			}
		}

		// Thumbnail does not exist add it to queue
		this.ThumbnailCreator.createThumbnail(file);

		// Return a placeholder immediately.
		res.setHeader('Cache-Control', 'public, max-age=5');
		return res.sendFile(`${process.cwd()}/assets/missing-file-icon.png`);
	}

	/**
	 * Get file system statistics for all storages.
	 * @returns An array of storage statistics including name, used size, and total size.
	 */
	async getFileSystemStatistics() {
		const storages = await this.storageManager.fetchAll({ page: 0 });
		return storages.map(s => ({ name: s.name, used: Number(s.usedSize), total: Number(s.maxSize) }));
	}
}