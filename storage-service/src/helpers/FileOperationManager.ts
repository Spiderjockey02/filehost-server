import { CONSTANTS, normalizePath, sanitiseObject } from '../utils';
import type { File, User } from '@prisma/client';
import TrashHandler from './TrashHandler';
import Client from './Client';
import FileAccessor from '../accessors/File';
import StorageManager from './StorageManager';
import type { Response } from 'express';
import ThumbnailCreator from './ThumbnailCreator';
import { FullFile } from 'src/types/database/File';
import archiver, { Archiver } from 'archiver';
import { StorageProvider } from 'src/types';

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
			await this.create({ userId: user.id, path: '/', size: CONSTANTS.FOLDER_SIZE, type: 'DIRECTORY', name: '/', mimetype: null, storageId: user.storageId });
			await this.client.notificationManager.create({
				title: 'Welcome!',
				text: 'Thank you for registering. You can now start uploading files, customizing your storage, and exploring all the features.',
				userId: user.id,
			});
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
			}
		}
	}

	/**
	  * Rename a file
	  * @param {User} user The user.
	  * @param {string} fileId The file's ID that is being renamed
		* @param {string} newName The new name for the file
	*/
	async rename(user: User, fileId: string, newName: string) {
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
		await this.update({ id: file.id, name: newName, path: newPath });
		if (file.type === 'DIRECTORY') await this.updateChildsPath({ parentId: file.id, userId: user.id, oldPath: file.path, newPath });

		// Update file in the filesystem (If it fails rollback the database changes)
		this.cache.delete(`${file.userId}_${file.path}`);
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
		const file = await this.update({
			id: parentDir.id,
			children: {
				userId: user.id,
				name: folderName,
				path: `${normalizePath(parentDir.path)}${folderName}`,
				size: CONSTANTS.FOLDER_SIZE,
				type: 'DIRECTORY',
				mimetype: null,
				storageId: user.storageId,
			},
		});

		return file.children.find(f => f.path == `${normalizePath(parentDir.path)}${folderName}`)!;
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
		let newFile: FullFile | null = null;
		try {
			newFile = await this.create({
				path: newFilePath,
				name: oldFile.name,
				size: oldFile.size,
				userId: oldFile.userId,
				type: oldFile.type,
				parentId: newDir.id,
				mimetype: oldFile.mimetype,
				storageId: user.storageId,
			});

			// Copy the actual file contents
			await fileProvider.copyFileOnSystem(`${user.id}/${oldFile.id}`, `${user.id}/${newFile.id}`);
		} catch (err) {
			if (newFile?.id) await this.deleteFromDB(newFile.id);
			throw err;
		}
	}

	/**
	  * Copies a directory directly
	  * @param {User} user The user's ID.
	  * @param {File} oldDir file path of the directory.
		* @param {File} newDir The name of the folder.
	*/
	private async _copyDirectory(user: User, oldDir: File, newDir: File) {
		const newFilePath = `${newDir.path}${oldDir.path.substring(oldDir.path.lastIndexOf('/'))}`;

		// Check if file already exists in the target directory
		const existingFile = await this.getByFilePath(user.id, newFilePath);
		if (existingFile) throw 'A file with that name already exists in the same directory.';

		// Create the new directory, but ensure the path doesn't include the old folder name twice
		const newFolder = await this.create({
			path: newFilePath,
			name: oldDir.name,
			size: CONSTANTS.FOLDER_SIZE,
			userId: oldDir.userId,
			type: 'DIRECTORY',
			parentId: newDir.id,
			mimetype: null,
			storageId: user.storageId,
		});

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
	  * @param {Response} res The response to pipe files to
	  * @param {User} user The user who requested the download.
	  * @param {File} file The file to download
	*/
	async downloadFile(res: Response, user: User, file: FullFile) {
		// Get storage and it's provider
		const storage = await this.storageManager.fetchById(user.storageId);
		if (storage == null) throw 'Storage not found';
		const fileProvider = this.storageManager.getProvider(storage);

		// Download the file
		if (file.type == 'DIRECTORY') {
			const archive = archiver('zip', { zlib: { level: 9 } });
			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
			archive.pipe(res);

			// Now loop and get the children's files
			for (const child of file.children) {
				if (child.type == 'DIRECTORY') {
					const newFile = await this.getByFilePath(user.id, child.path);
					if (newFile) await this.traverseFilesForDownloading(archive, newFile, fileProvider, file.path);
				} else {
					archive.append(await fileProvider.readFileFromSystem(child), { name: child.path.replace(file.path, '') });
				}
			}

			await archive.finalize();
		} else {
			fileProvider.downloadFile(res, file);
		}
	}

	async traverseFilesForDownloading(archive: Archiver, file: FullFile, fileProvider: StorageProvider, parentFilePath: string) {
		for (const child of file.children) {
			if (child.type == 'DIRECTORY') {
				const newFile = await this.getByFilePath(child.userId, child.path);
				if (newFile) await this.traverseFilesForDownloading(archive, newFile, fileProvider, parentFilePath);
			} else {
				archive.append(await fileProvider.readFileFromSystem(child), { name: child.path.replace(parentFilePath, '') });
			}
		}

		return archive;
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

		const hasCustomAvatar = await fileProvider.checkFileExists(`${userId}.webp`);
		fileProvider.sendFile(res, { path: hasCustomAvatar ? `${userId}.webp` : 'default-avatar.webp', userId: '', mimetype: 'image/webp' } as File);
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The HTTP response object.
	  * @param {string} userId The user's ID.
	  * @param {string} filePath The filepath of the file for the thumbnail
	*/
	async sendThumbnail(res: Response, userId: string, filePath: string) {
		const file = await this.getByFilePath(userId, filePath);
		if (file == null) return res.sendFile(`${process.cwd}/assets/missing-file-icon.png`);

		// Get the mimeType of the file
		if (file.mimetype == null) return res.sendFile(`${process.cwd}/assets/missing-file-icon.png`);

		// Send thumbnail if it exists, create it if it doesn't
		const storageProvider = await this.storageManager.getProviderById(file.storageId);
		try {
			await storageProvider.sendFile(res, { ...file, id: `${file.id}.jpg` });
		} catch (err: any) {
			if (err.$metadata.httpStatusCode == 404) {
				try {
					await this.ThumbnailCreator.createThumbnail(file);
					await storageProvider.sendFile(res, { ...file, id: `${file.id}.jpg` });
				} catch {
					return res.sendFile(`${process.cwd}/assets/missing-file-icon.png`);
				}
			}
		}
	}

	async getFileSystemStatistics() {
		const storages = await this.storageManager.fetchAll({ page: 0 });
		const data = storages.map(s => ({ name: s.name, stats: this.storageManager.getProvider(s).getFileSystemStatistics() }));
		return data;
	}
}