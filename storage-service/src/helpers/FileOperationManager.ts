import { CONSTANTS, normalizePath, PATHS, sanitiseObject } from '../utils';
import type { File, User } from '@prisma/client';
import TrashHandler from './TrashHandler';
import path from 'node:path';
import Client from './Client';
import FileAccessor from '../accessors/File';
import StorageManager from './StorageManager';
import type { Response } from 'express';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import ThumbnailCreator from './ThumbnailCreator';

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
	  * @param {string} filePath file path of the directory.
	*/
	async getDirectory(user: User, filePath: string) {
		// eslint-disable-next-line prefer-const
		let [files, storage] = await Promise.all([
			this.getByFilePath(user.id, filePath),
			this.storageManager.fetchById(user.storageId),
		]);
		if (storage == null) throw 'Storage not found';

		// If it's user's first login, the directory doesn't exist so create it
		if (files == null && filePath == '') {
			await this.create({ userId: user.id, path: '/', size: 0n, type: 'DIRECTORY', name: '/', mimetype: null, storageId: user.storageId });
			await this.storageManager.getProvider(storage).createFolderOnSystem(`${user.id}/`, { recursive: true });
			files = await this.getByFilePath(user.id, filePath);
		}

		return sanitiseObject(files);
	}

	/**
	  * Deletes a file
	  * @param {string} userId The user's ID.
	  * @param {string} fileId file path of the file.
		* @returns {File} The deleted file
	*/
	async delete(userId: string, fileId: string): Promise<File> {
		return this.TrashHandler.moveToTrash(userId, fileId);
	}

	/**
	  * Moves a file
	  * @param {User} user The user.
	  * @param {string} fileId The file's ID that is being moved
		* @param {string} newDirId The new file path.
	*/
	async move(user: User, fileId: string, newDirId: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		// First Make sure they are not the same IDs
		if (fileId === newDirId) throw 'Cannot move a file into itself.';

		// Fetch the files from the database
		const oldFile = await this.getById(fileId);
		const newDir = await this.getById(newDirId);
		if (oldFile == null) throw 'File not found';
		if (newDir == null || newDir.type !== 'DIRECTORY') throw 'Directory not found';

		// Check the owner of the file and folder
		if (oldFile.userId !== user.id || newDir.userId !== user.id) throw 'You do not have permission to move this file.';

		// Generate new file path for the current item
		const newFilePathInDb = `${normalizePath(newDir.path)}${oldFile.path.split('/').at(-1)}`;

		// Make sure a file with the potential same name doesn't already exist
		const existingFile = await this.getByFilePath(user.id, newFilePathInDb);
		if (existingFile) throw 'A file with that name already exists in the same directory.';

		// Update the old parent directory
		const oldParent = await this.getById(oldFile.parentId);
		if (oldParent !== null) this.cache.delete(`${oldParent.userId}_${oldParent.path}`);

		await this.update({
			id: oldFile.id,
			parentId: newDir.id,
			path: newFilePathInDb,
		});

		// If it's a folder, process its children (don't move the folder itself again)
		if (oldFile.type === 'DIRECTORY') {
			const children = await this.getChildrenByParentId(oldFile.id);

			// Check if the folder is empty
			if (children.length > 0) {
				// Move all child files/subfolders
				for (const child of children) {
					await this.move(user, child.id, oldFile.id);
				}
			} else {
				await fileProvider.createFolderOnSystem(path.join(user.id, newFilePathInDb), { recursive: true });
			}

			// Delete the old folder now it should be empty
			if (await fileProvider.getNumberOfChildrenInFolder(path.join(user.id, oldFile.path)) === 0) {
				await fileProvider.deleteFolderOnSystem(path.join(user.id, oldFile.path));
			}
			return;
		}

		// Ensure the new folder structure exists on the file system
		await fileProvider.createFolderOnSystem(path.dirname(path.join(user.id, newFilePathInDb)), { recursive: true });

		// Move the file/folder on the file system
		await fileProvider.renameOnSystem(path.join(user.id, oldFile.path), path.join(user.id, newFilePathInDb));
	}

	/**
	  * Rename a file
	  * @param {User} user The user.
	  * @param {string} fileId The file's ID that is being renamed
		* @param {string} newName The new name for the file
	*/
	async rename(user: User, fileId: string, newName: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		const file = await this.getById(fileId);
		if (file == null) throw 'File not found';

		// Check the owner of the file
		if (file.userId !== user.id) throw 'You do not have permission to rename this file.';

		// Update the file
		const pathSegs = file.path.split('/');
		pathSegs[pathSegs.length - 1] = newName;
		const newPath = pathSegs.join('/');

		// Make sure the new name doesn't have any invalid characters in it
		if (CONSTANTS.INVALID_CHARS_IN_FILE_NAME.some(c => newName.includes(c))) throw 'File name includes invalid characters.';

		// Makes sure the new name is less than the max characters
		if (newName.length > CONSTANTS.MAX_CHARS_FILE_NAME) throw `New name must be less than ${CONSTANTS.MAX_CHARS_FILE_NAME} characters.`;

		// Make sure a file with the potential same name doesn't already exist
		const existingFile = await this.getByFilePath(user.id, newPath);
		if (existingFile) throw 'A file with that name already exists in the same directory.';

		// Will update to also support their children for path to be updated aswell (when it's a directory)
		const newFile = await this.update({ id: file.id, name: newName, path: newPath });
		if (file.type === 'DIRECTORY') await this.updateChildsPath({ parentId: file.id, userId: user.id, oldPath: file.path, newPath });

		// Update file in the filesystem (If it fails rollback the database changes)
		this.cache.delete(`${file.userId}_${file.path}`);
		try {
			// Rename the file in the filesystem
			await fileProvider.renameOnSystem(path.join(user.id, file.path), path.join(user.id, newFile.path));
		} catch (err) {
			console.log(err);
			// Rollback database changes on failure
			await this.update({ id: file.id, name: file.name, path: file.path });
			if (file.type === 'DIRECTORY') await this.updateChildsPath({ parentId: file.id, userId: user.id, oldPath: newPath, newPath: file.path });
			throw 'Failed to rename file in filesystem.';
		}
	}

	/**
	  * Copies a file
	  * @param {User} user The user's ID.
	  * @param {string} fileId The file / directory that will be copied
		* @param {string} newDirId The directory the file / directory will be copied into
	*/
	async copy(user: User, fileId: string, newDirId: string) {
		const file = await this.getById(fileId);
		const newDir = await this.getById(newDirId);
		if (file == null) throw 'File not found';
		if (newDir == null || newDir.type !== 'DIRECTORY') throw 'Directory not found';

		// Check the owner of the files
		if (file.userId !== user.id || newDir.userId !== user.id) throw 'You do not have permission to move this file.';

		// Delete the new file's cache
		this.cache.delete(`${user.id}_${newDir.path}`);

		// If the old file is a directory, copy the directory and its contents recursively
		if (file.type === 'DIRECTORY') {
			await this._copyDirectory(user, file, newDir);
		} else {
			await this._copyFile(user, file, newDir);
		}
	}

	/**
	  * Creates a directory
	  * @param {User} user The user's ID.
	  * @param {string} parentId file path of the directory.
		* @param {string} folderName The name of the folder.
	*/
	async createDirectory(user: User, parentId: string, folderName: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		// Check if the folder name is longer than max chars
		if (folderName.length > CONSTANTS.MAX_CHARS_FILE_NAME) throw `Folder name must be less than ${CONSTANTS.MAX_CHARS_FILE_NAME} characters.`;

		// Make sure the new name doesn't have any invalid characters in it
		if (CONSTANTS.INVALID_CHARS_IN_FILE_NAME.some(c => folderName.includes(c))) throw 'Folder name includes invalid characters.';

		// Fetch the parent directory
		const parentDir = await this.getById(parentId);
		if (parentDir == null || parentDir.type !== 'DIRECTORY') throw 'Directory not found';

		// Check the owner of the file
		if (parentDir?.userId !== user.id) throw 'You do not have permission to rename this file.';

		// Update the parent directory to include the new folder
		await this.update({ id: parentDir.id,
			children: {
				userId: user.id,
				name: folderName,
				path: `${normalizePath(parentDir.path)}${folderName}`,
				size: 4096n,
				type: 'DIRECTORY',
				mimetype: null,
				storageId: user.storageId,
			},
		});
		return fileProvider.createFolderOnSystem(path.join(user.id, parentDir.path, folderName), { recursive: true });
	}

	/**
	  * Copies a file directly
	  * @param {User} user The user's ID.
	  * @param {File} oldFile file path of the directory.
		* @param {File} newDir The name of the folder.
	*/
	private async _copyFile(user: User, oldFile: File, newDir: File) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		// Generate the new file path
		const newFilePath = `${newDir.path}${oldFile.path.substring(oldFile.path.lastIndexOf('/'))}`;

		// Check if file already exists in the target directory
		const existingFile = await this.getByFilePath(user.id, newFilePath);
		if (existingFile) throw 'A file with that name already exists in the same directory.';

		// Create the new file entry in the database
		const newFile = await this.create({
			path: newFilePath,
			name: oldFile.name,
			size: oldFile.size,
			userId: oldFile.userId,
			type: oldFile.type,
			parentId: newDir.id,
			mimetype: oldFile.mimetype,
			storageId: user.storageId,
		});

		// Ensure the target directory exists on the filesystem
		await fileProvider.createFolderOnSystem(path.join(user.id, newFile.path.substring(0, newFile.path.lastIndexOf('/'))), { recursive: true });

		// Copy the actual file contents
		await fileProvider.copyFileOnSystem(path.join(user.id, oldFile.path), path.join(user.id, newFile.path));
	}

	/**
	  * Copies a directory directly
	  * @param {User} user The user's ID.
	  * @param {File} oldDir file path of the directory.
		* @param {File} newDir The name of the folder.
	*/
	private async _copyDirectory(user: User, oldDir: File, newDir: File) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		const newFilePath = `${newDir.path}${oldDir.path.substring(oldDir.path.lastIndexOf('/'))}`;

		// Check if file already exists in the target directory
		const existingFile = await this.getByFilePath(user.id, newFilePath);
		if (existingFile) throw 'A file with that name already exists in the same directory.';

		// Create the new directory, but ensure the path doesn't include the old folder name twice
		const newFolder = await this.create({
			path: newFilePath,
			name: oldDir.name,
			size: 0n,
			userId: oldDir.userId,
			type: 'DIRECTORY',
			parentId: newDir.id,
			mimetype: null,
			storageId: user.storageId,
		});

		// / Create the directory on the filesystem as well
		await fileProvider.createFolderOnSystem(path.join(user.id, newFolder.path), { recursive: true });

		// Recursively copy files and subdirectories inside this folder
		const children = await this.getChildrenByParentId(oldDir.id);

		for (const child of children) {
			if (child.type === 'DIRECTORY') {
				// If it's a folder, copy it recursively
				await this._copyDirectory(user, child, newFolder);
			} else {
				// If it's a file, copy it
				await this._copyFile(user, child, newFolder);
			}
		}
	}

	/**
	  * Download a single file
	  * @param {Response} res The user's ID.
	  * @param {User} user The user's ID.
	  * @param {string} filePath The user's ID.
	*/
	async downloadFile(res: Response, user: User, filePath: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		// Download the file
		return fileProvider.downloadFile(res, user.id, filePath);
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The user's ID.
	  * @param {User} user The user's ID.
	  * @param {string} filePath The user's ID.
	*/
	async downloadDirectory(res: Response, user: User, filePath: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		// Download the file
		return fileProvider.downloadDirectory(res, user.id, filePath);
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The user's ID.
	  * @param {User} user The user's ID.
	  * @param {File[]} filePaths The user's ID.
	*/
	async downloadFiles(res: Response, user: User, files: File[]) {
	// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		// Download the file
		return fileProvider.downloadFiles(res, user.id, files);
	}

	/**
	  * Send a file to the user.
	  * @param {Response} res The HTTP response object.
		* @param {File} file The file to send.
	*/
	async sendFile(res: Response, user: User, file: File, range?: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		// Download the file
		return fileProvider.sendFile(res, file, range);
	}

	/**
	  * Delete user's avatar (If there is one).
	  * @param {string} userId The user's ID.
	*/
	async deleteAvatar(userId: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchByName('Avatars');
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);
		fileProvider.deleteFileOnSystem(`${userId}.webp`);
	}

	/**
	  * Send the user's avatar.
		* @param {Response} res The HTTP response object.
	  * @param {string} userId The user's ID.
	*/
	async sendAvatar(res: Response, userId: string) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchByName('Avatars');
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		fileProvider.sendFile(res, { path: `${userId}.webp`, userId: '' } as File);
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The HTTP response object.
	  * @param {string} userId The user's ID.
	  * @param {string} filePath The filepath of the file for the thumbnail
	*/
	async sendThumbnail(res: Response, userId: string, filePath: string) {
		const file = await this.getByFilePath(userId, filePath);
		if (file == null) return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);

		// Get the mimeType of the file
		const fileName = file.name.slice(0, file.name.lastIndexOf('.'));
		if (file.mimetype == null) return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);

		// Create folder (if needed to)
		const folder = file.path.split('/').slice(0, -1).join('/');
		const folderPath = `${PATHS.THUMBNAIL}/${userId}/${folder}`;
		if (!existsSync(folderPath)) await mkdir(`${PATHS.THUMBNAIL}/${userId}/${folder}`, { recursive: true });

		// Send or create the thumbnail
		const thumbnailPath = `${folderPath}/${fileName}.jpg`;
		if (existsSync(thumbnailPath)) {
			res.sendFile(thumbnailPath);
		} else {
			await this.ThumbnailCreator.createThumbnail(file);
			res.sendFile(existsSync(thumbnailPath) ? thumbnailPath : `${PATHS.THUMBNAIL}/missing-file-icon.png`);
		}
	}

	async getFileSystemStatistics() {
		const storages = await this.storageManager.fetchAll();
		const data = storages.map(s => ({ name: s.name, stats: this.storageManager.getProvider(s).getFileSystemStatistics() }));
		return data;
	}
}