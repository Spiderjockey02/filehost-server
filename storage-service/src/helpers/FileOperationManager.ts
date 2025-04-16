import { CONSTANTS, normalizePath, PATHS, sanitiseObject } from '../utils';
import FileSystemManager from './FileSystemManager';
import type { File } from '@prisma/client';
import TrashHandler from './TrashHandler';
import path from 'node:path';
import Client from './Client';

export default class FileManager extends FileSystemManager {
	TrashHandler: TrashHandler;

	constructor(client: Client) {
		super();
		this.TrashHandler = new TrashHandler(client);
	}

	/**
	  * Retrieves the files in a directory
	  * @param {string} userId The user's ID.
	  * @param {string} filePath file path of the directory.
	*/
	async getDirectory(userId: string, filePath: string) {
		let files = await this.getByFilePath(userId, filePath);

		// If it's user's first login, the directory doesn't exist so create it
		if (files == null && filePath == '') {
			await this.create({ userId, path: '/', size: 0n, type: 'DIRECTORY', name: '/', mimetype: null });
			await this.createFolderOnSystem(path.join(PATHS.CONTENT, userId, '/'), { recursive: true });
			files = await this.getByFilePath(userId, filePath);
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
	  * @param {string} userId The user's ID.
	  * @param {string} fileId The file's ID that is being moved
		* @param {string} newDirId The new file path.
	*/
	async move(userId: string, fileId: string, newDirId: string) {
		// First Make sure they are not the same IDs
		if (fileId === newDirId) throw 'Cannot move a file into itself.';

		// Fetch the files from the database
		const oldFile = await this.getById(fileId);
		const newDir = await this.getById(newDirId);
		if (oldFile == null || newDir == null) throw 'File not found path.';

		// Check the owner of the file and folder
		if (oldFile.userId !== userId || newDir.userId !== userId) throw 'You do not have permission to move this file.';

		// Generate new file path for the current item
		const newFilePathInDb = `${normalizePath(newDir.path)}${oldFile.path.split('/').at(-1)}`;

		// Make sure a file with the potential same name doesn't already exist
		const existingFile = await this.getByFilePath(userId, newFilePathInDb);
		if (existingFile) throw 'CONFLICT';

		// Update the current file/folder in the database
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
					await this.move(userId, child.id, oldFile.id);
				}
			} else {
				await this.createFolderOnSystem(path.join(PATHS.CONTENT, userId, newFilePathInDb), { recursive: true });
			}

			// Delete the old folder now it should be empty
			const oldFolderPath = path.join(PATHS.CONTENT, userId, oldFile.path);
			if (await this.getNumberOfChildrenInFolder(oldFolderPath) === 0) await this.deleteFolderOnSystem(oldFolderPath);
			return;
		}

		// Ensure the new folder structure exists on the file system
		const newFileSystemPath = path.join(PATHS.CONTENT, userId, newFilePathInDb);
		await this.createFolderOnSystem(path.dirname(newFileSystemPath), { recursive: true });

		// Move the file/folder on the file system
		await this.renameOnSystem(path.join(PATHS.CONTENT, userId, oldFile.path), newFileSystemPath);
	}

	/**
	  * Rename a file
	  * @param {string} userId The user's ID.
	  * @param {string} fileId The file's ID that is being renamed
		* @param {string} newName The new name for the file
	*/
	async rename(userId: string, fileId: string, newName: string) {
		const file = await this.getById(fileId);
		if (file == null) throw 'File not found';

		// Check the owner of the file
		if (file.userId !== userId) throw 'You do not have permission to rename this file.';

		// Update the file
		const pathSegs = file.path.split('/');
		pathSegs[pathSegs.length - 1] = newName;
		const newPath = pathSegs.join('/');

		// Make sure the new name doesn't have any invalid characters in it
		if (CONSTANTS.INVALID_CHARS_IN_FILE_NAME.some(c => newName.includes(c))) throw 'File name includes invalid characters.';

		// Makes sure the new name is less than the max characters
		if (newName.length > CONSTANTS.MAX_CHARS_FILE_NAME) throw `New name must be less than ${CONSTANTS.MAX_CHARS_FILE_NAME} characters.`;

		// Make sure a file with the potential same name doesn't already exist
		const existingFile = await this.getByFilePath(userId, newPath);
		if (existingFile) throw 'A file with that name already exists in the same directory.';

		// Will update to also support their children for path to be updated aswell (when it's a directory)
		const newFile = await this.update({ id: file.id, name: newName, path: newPath });
		if (file.type === 'DIRECTORY') await this.updateChildsPath({ userId, oldPath: file.path, newPath });

		// Update file in the filesystem (If it failes rollback the database changes)
		try {
			// Rename the file in the filesystem
			await this.renameOnSystem(path.join(PATHS.CONTENT, userId, file.path), path.join(PATHS.CONTENT, userId, newFile.path));
		} catch (err) {
			// Rollback database changes on failure
			await this.update({ id: file.id, name: file.name, path: file.path });
			if (file.type === 'DIRECTORY') await this.updateChildsPath({ userId, oldPath: newPath, newPath: file.path });

			throw new Error('Failed to rename file in filesystem.');
		}
	}

	/**
	  * Copies a file
	  * @param {string} userId The user's ID.
	  * @param {string} fileId The file / directory that will be copied
		* @param {string} newDirId The directory the file / directory will be copied into
	*/
	async copy(userId: string, fileId: string, newDirId: string) {
		const file = await this.getById(fileId);
		const newDir = await this.getById(newDirId);
		if (file == null || newDir == null) throw new Error('Invalid path.');

		// Check the owner of the files
		if (file.userId !== userId || newDir.userId !== userId) throw 'You do not have permission to move this file.';

		// If the old file is a directory, copy the directory and its contents recursively
		if (file.type === 'DIRECTORY') {
			await this._copyDirectory(userId, file, newDir);
		} else {
			await this._copyFile(userId, file, newDir);
		}
	}

	/**
	  * Creates a directory
	  * @param {string} userId The user's ID.
	  * @param {string} parentId file path of the directory.
		* @param {string} folderName The name of the folder.
	*/
	async createDirectory(userId: string, parentId: string, folderName: string) {
		// Check if the folder name is longer than max chars
		if (folderName.length > CONSTANTS.MAX_CHARS_FILE_NAME) throw `Folder name must be less than ${CONSTANTS.MAX_CHARS_FILE_NAME} characters.`;

		// Make sure the new name doesn't have any invalid characters in it
		if (CONSTANTS.INVALID_CHARS_IN_FILE_NAME.some(c => folderName.includes(c))) throw 'Folder name includes invalid characters.';

		// Fetch the parent directory
		const parentDir = await this.getById(parentId);
		if (parentDir == null || parentDir.type !== 'DIRECTORY') throw 'Directory not found';

		// Check the owner of the file
		if (parentDir?.userId !== userId) throw 'You do not have permission to rename this file.';

		// Update the parent directory to include the new folder
		await this.update({ id: parentDir.id,
			children: {
				userId,
				name: folderName,
				path: `${normalizePath(parentDir.path)}${folderName}`,
				size: 0n,
				type: 'DIRECTORY',
				mimetype: null,
			},
		});
		return this.createFolderOnSystem(path.join(PATHS.CONTENT, userId, parentDir.path, folderName), { recursive: true });
	}

	/**
	  * Copies a file directly
	  * @param {string} userId The user's ID.
	  * @param {File} oldFile file path of the directory.
		* @param {File} newDir The name of the folder.
	*/
	private async _copyFile(userId: string, oldFile: File, newDir: File) {
		// Generate the new file path
		const newFilePath = `${newDir.path}${oldFile.path.substring(oldFile.path.lastIndexOf('/'))}`;

		// Check if file already exists in the target directory
		const existingFile = await this.getByFilePath(userId, newFilePath);
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
		});

		// Ensure the target directory exists on the filesystem
		const newFileDir = path.join(PATHS.CONTENT, userId, newFile.path.substring(0, newFile.path.lastIndexOf('/')));
		await this.createFolderOnSystem(newFileDir, { recursive: true });

		// Copy the actual file contents
		await this.copyFileOnSystem(
			path.join(PATHS.CONTENT, userId, oldFile.path),
			path.join(PATHS.CONTENT, userId, newFile.path),
		);
	}

	/**
	  * Copies a directory directly
	  * @param {string} userId The user's ID.
	  * @param {File} oldDir file path of the directory.
		* @param {File} newDir The name of the folder.
	*/
	private async _copyDirectory(userId: string, oldDir: File, newDir: File) {
		const newFilePath = `${newDir.path}${oldDir.path.substring(oldDir.path.lastIndexOf('/'))}`;

		// Check if file already exists in the target directory
		const existingFile = await this.getByFilePath(userId, newFilePath);
		if (existingFile) throw 'A file with that name already exists in the same directory.';

		// Create the new directory, but ensure the path doesn't include the old folder name twice
		const newFolder = await this.create({
			path: newFilePath,
			name: oldDir.name,
			size: 0n,
			userId: oldDir.userId,
			type: 'DIRECTORY',
			parentId: newDir.id,
			mimetype: null
		});

		// / Create the directory on the filesystem as well
		const newFolderPath = path.join(PATHS.CONTENT, userId, newFolder.path);
		await this.createFolderOnSystem(newFolderPath, { recursive: true });

		// Recursively copy files and subdirectories inside this folder
		const children = await this.getChildrenByParentId(oldDir.id);

		for (const child of children) {
			if (child.type === 'DIRECTORY') {
				// If it's a folder, copy it recursively
				await this._copyDirectory(userId, child, newFolder);
			} else {
				// If it's a file, copy it
				await this._copyFile(userId, child, newFolder);
			}
		}
	}
}