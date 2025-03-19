import { CONSTANTS, Error as ErrorCL, PATHS, sanitiseObject } from '../utils';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import util from 'node:util';
import { exec } from 'node:child_process';
import type { Response } from 'express';
import FileAccessor from '../accessors/File';
import archiver from 'archiver';
import TrashHandler from './TrashHandler';
import { lookup } from 'mime-types';
import type { File } from '@prisma/client';
import ThumbnailCreator from './ThumbnailCreator';
const cmd = util.promisify(exec);

interface diskStorage {
  free: number
  total: number
}
export default class FileManager extends FileAccessor {
	diskData: diskStorage;
	TrashHandler: TrashHandler;
	ThumbnailCreator: ThumbnailCreator;
	constructor() {
		super();
		this.TrashHandler = new TrashHandler(this);
		this.ThumbnailCreator = new ThumbnailCreator();

		// Fetch disk data & update every 5 minutes
		this.diskData = { free: 0, total: 0 };
		this._fetchDiskData();
		setInterval(() => this._fetchDiskData(), 1000 * 60 * 10);
	}

	/**
	  * Retrieves the files in a directory
	  * @param {string} userId The user's ID.
	  * @param {string} filePath file path of the directory.
	*/
	async getDirectory(userId: string, filePath: string) {
		const files = await this.getByFilePath(userId, filePath);
		return sanitiseObject(files);
	}

	/**
	  * Deletes a file
	  * @param {string} userId The user's ID.
	  * @param {string} filePath file path of the file.
		* @returns {File} The deleted file
	*/
	async delete(userId: string, filePath: string): Promise<File> {
		return this.TrashHandler.moveToTrash(userId, filePath);
	}

	/**
	  * Moves a file
	  * @param {string} userId The user's ID.
	  * @param {string} oldFilePath The old file path.
		* @param {string} newFilePath The new file path.
	*/
	async move(userId: string, oldFilePath: string, newFilePath: string) {
		const oldFile = await this.getByFilePath(userId, oldFilePath);
		const newDir = await this.getByFilePath(userId, newFilePath);
		if (oldFile == null || newDir == null) throw new Error('Invalid path.');

		// Generate new file path for the current item
		const newFilePathInDb = `${newDir.path}/${oldFilePath.split('/').at(-1)}`;

		// Update the current file/folder in the database
		await this.update({
			id: oldFile.id,
			parentId: newDir.id,
			path: newFilePathInDb,
		});

		// If it's a folder, process its children (don't move the folder itself again)
		if (oldFile.type === 'DIRECTORY') {
			const children = await this.getChildrenByParentId(oldFile.id);

			// Move all child files/subfolders
			for (const child of children) {
				await this.move(userId, child.path, newFilePathInDb);
			}

			// Delete the old folder now it should be empty
			const oldFolderPath = path.join(PATHS.CONTENT, userId, oldFilePath);
			if ((await fs.readdir(oldFolderPath)).length === 0) {
				await fs.rmdir(oldFolderPath);
			}
			return;
		}

		// Ensure the new folder structure exists on the file system
		const newFileSystemPath = path.join(PATHS.CONTENT, userId, newFilePathInDb);
		await fs.mkdir(path.dirname(newFileSystemPath), { recursive: true });

		// Move the file/folder on the file system
		await fs.rename(path.join(PATHS.CONTENT, userId, oldFile.path), newFileSystemPath);
	}

	async rename(userId: string, filePath: string, newName: string) {
		const file = await this.getByFilePath(userId, filePath);
		if (file === null) throw 'File not found';

		// Update the file
		const pathSegs = file.path.split('/');
		pathSegs[pathSegs.length - 1] = newName;
		const newPath = pathSegs.join('/');

		// Make sure the new name doesn't have any invalid characters in it
		if (CONSTANTS.INVALID_CHARS_IN_FILE_NAME.some(c => newName.includes(c))) throw 'File name includes invalid characters.';

		// Will update to also support their children for path to be updated aswell (when it's a directory)
		await this.update({ id: file.id, name: newName, path: newPath });
		if (file.type === 'DIRECTORY') await this.updateChildsPath({ userId, oldPath: file.path, newPath });

		return fs.rename(path.join(PATHS.CONTENT, userId, filePath), path.join(PATHS.CONTENT, userId, newName));
	}

	/**
	  * Copies a file
	  * @param {string} userId The user's ID.
	  * @param {string} oldFilePath The old file path.
		* @param {string} newFilePath The new file path.
	*/
	async copy(userId: string, oldFilePath: string, newFilePath: string) {
		const oldFile = await this.getByFilePath(userId, oldFilePath);
		const newDir = await this.getByFilePath(userId, newFilePath);

		if (oldFile == null || newDir == null) throw new Error('Invalid path.');

		// If the old file is a directory, copy the directory and its contents recursively
		if (oldFile.type === 'DIRECTORY') {
			await this._copyDirectory(userId, oldFile, newDir);
		} else {
			// If it's a file, copy it as you already have in your original function
			await this._copyFile(userId, oldFile, newDir);
		}
	}

	private async _copyFile(userId: string, oldFile: File, newDir: File) {
		// Generate the new file path
		const newFilePath = `${newDir.path}${oldFile.path.substring(oldFile.path.lastIndexOf('/'))}`;

		// Create the new file entry in the database
		const newFile = await this.create({
			path: newFilePath,
			name: oldFile.name,
			size: oldFile.size,
			userId: oldFile.userId,
			type: oldFile.type,
			parentId: newDir.id,
		});

		// Ensure the target directory exists on the filesystem
		const newFileDir = path.join(PATHS.CONTENT, userId, newFile.path.substring(0, newFile.path.lastIndexOf('/')));
		await fs.mkdir(newFileDir, { recursive: true });

		// Copy the actual file contents
		await fs.copyFile(
			path.join(PATHS.CONTENT, userId, oldFile.path),
			path.join(PATHS.CONTENT, userId, newFile.path),
			fs.constants.COPYFILE_EXCL,
		);
	}

	private async _copyDirectory(userId: string, oldDir: File, newDir: File) {
		// Create the new directory, but ensure the path doesn't include the old folder name twice
		const newFolder = await this.create({
			path: `${newDir.path}${oldDir.path.substring(oldDir.path.lastIndexOf('/'))}`,
			name: oldDir.name,
			size: 0n,
			userId: oldDir.userId,
			type: 'DIRECTORY',
			parentId: newDir.id,
		});

		// / Create the directory on the filesystem as well
		const newFolderPath = path.join(PATHS.CONTENT, userId, newFolder.path);
		await fs.mkdir(newFolderPath, { recursive: true });

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

	/**
	  * Creates a directory
	  * @param {string} userId The user's ID.
	  * @param {string} filePath file path of the directory.
		* @param {string} folderName The name of the folder.
	*/
	async createDirectory(userId: string, filePath: string, folderName: string) {
		const fullPath = path.join(PATHS.CONTENT, userId, filePath, folderName);
		const isPathValid = this._verifyTraversal(userId, fullPath);
		if (!isPathValid) throw new Error('Invalid path');

		// Create the directory
		const dir = await this.getByFilePath(userId, filePath);
		if (dir !== null) {
			await this.update({ id: dir.id,
				children: {
					userId,
					name: folderName,
					path: `${filePath}${folderName}`,
					size: 0n,
					type: 'DIRECTORY',
				},
			});
		}
		return fs.mkdir(fullPath, { recursive: true });
	}

	/**
	  * Retrieves the file system statistics
		* @returns {diskStorage} The disk storage data.
	*/
	getFileSystemStatitics(): diskStorage {
		return this.diskData;
	}

	downloadFile(res: Response, userId: string, filePath: string) {
		res.download(path.join(PATHS.CONTENT, userId, filePath));
	}

	async downloadDirectory(res: Response, userId: string, filePath: string) {
		const archive = archiver('zip', { zlib: { level: 9 } });
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}.zip"`);

		// Append directory to archive
		archive.pipe(res);
		archive.directory(path.join(PATHS.CONTENT, userId, filePath), false);

		try {
			await archive.finalize();
			res.end();
		} catch (error) {
			ErrorCL.GenericError(res, 'Failed to create archive');
		}
	}

	async downloadFiles(res: Response, userId: string, filePaths: string[]) {
		const archive = archiver('zip', { zlib: { level: 9 } });
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');

		// Append files to archive
		archive.pipe(res);

		for (const filePath of filePaths) {
			// Check if file is actually file or a folder
			const file = await this.getByFilePath(userId, filePath);
			if (file == null) continue;

			// Append file to archive
			if (file.type === 'FILE') {
				archive.file(path.join(PATHS.CONTENT, userId, filePath), { name: filePath });
			} else {
				archive.directory(path.join(PATHS.CONTENT, userId, filePath), file.name);
			}
		}

		try {
			await archive.finalize();
			res.end();
		} catch (error) {
			ErrorCL.GenericError(res, 'Failed to create archive');
		}
	}


	async deleteAvatar(userId: string) {
		if (existsSync(`${PATHS.AVATAR}/${userId}.webp`)) return fs.rm(`${PATHS.AVATAR}/${userId}.webp`);
	}

	async getThumbnail(res: Response, userId: string, filePath: string) {
		const file = await this.getByFilePath(userId, filePath);
		if (file == null) return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);

		// Get the mimeType of the file
		const fileType = lookup(file.path);
		const fileName = file.name.slice(0, file.name.lastIndexOf('.'));
		if (fileType == false) return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);

		// Create folder (if needed to)
		const folder = file.path.split('/').slice(0, -1).join('/');
		if (!existsSync(`${PATHS.THUMBNAIL}/${userId}/${folder}`)) await fs.mkdir(`${PATHS.THUMBNAIL}/${userId}/${folder}`, { recursive: true });

		if (existsSync(`${PATHS.THUMBNAIL}/${userId}${folder}/${fileName}.jpg`)) {
			res.sendFile(`${PATHS.THUMBNAIL}/${userId}${folder}/${fileName}.jpg`);
		} else {
			await this.ThumbnailCreator.createThumbnail(file.userId, file.path);
			res.sendFile(`${PATHS.THUMBNAIL}/${userId}${folder}/${fileName}.jpg`);
		}
	}

	/**
	  * Ensures the path is within the user's directory
	  * @param {string} userId The user's ID.
	  * @param {string} filePath How file path.
	*/
	_verifyTraversal(userId: string, filePath: string) {
		const userBasePath = path.resolve(PATHS.CONTENT, userId);
		const targetPath = path.resolve(filePath);
		return targetPath.startsWith(userBasePath);
	}

	/**
	  * Fetches disk data
	*/
	async _fetchDiskData() {
		const platform = process.platform;
		if (platform == 'win32') {
			const { stdout } = await cmd('wmic logicaldisk get size,freespace,caption');
			const parsed = stdout.trim().split('\n').slice(1).map(line => line.trim().split(/\s+(?=[\d/])/));
			const filtered = parsed.filter(d => process.cwd().toUpperCase().startsWith(d[0].toUpperCase()));
			this.diskData = {
				free: Number(filtered[0][1]),
				total: Number(filtered[0][2]),
			};
		} else if (platform == 'linux') {
			const { stdout } = await cmd('df -Pk --');
			const parsed = stdout.trim().split('\n').slice(1).map(line => line.trim().split(/\s+(?=[\d/])/));
			const filtered = parsed.filter(() => true);
			this.diskData = {
				free: Number(filtered[0][3]),
				total: Number(filtered[0][1]),
			};
		}
	}
}