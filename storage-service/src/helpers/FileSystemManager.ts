import { createReadStream, existsSync, MakeDirectoryOptions, Mode, readFileSync, statSync } from 'node:fs';
import ThumbnailCreator from './ThumbnailCreator';
import FileAccessor from '../accessors/File';
import type { File } from '@prisma/client';
import { exec } from 'node:child_process';
import { Error, PATHS } from '../utils';
import type { Response } from 'express';
import fs from 'node:fs/promises';
import archiver from 'archiver';
import path from 'node:path';
import util from 'node:util';
const cmd = util.promisify(exec);

interface diskStorage {
  free: number
  total: number
}

/**
 * FileSystemManager class
 * @extends FileAccessor
 * @classdesc Manages file system operations, this is where to edit if you want other storage system supports (e.g. AWS S3, etc.)
 */
export default class FileSystemManager extends FileAccessor {
	ThumbnailCreator: ThumbnailCreator;
	diskData: diskStorage;

	constructor() {
		super();
		this.ThumbnailCreator = new ThumbnailCreator();

		// Fetch disk data & update every 5 minutes
		this.diskData = { free: 0, total: 0 };
		this._fetchDiskData();
		setInterval(() => this._fetchDiskData(), 1000 * 60 * 10);
	}

	/**
	  * Delete user's avatar (If there is one).
	  * @param {string} userId The user's ID.
	*/
	async deleteAvatar(userId: string): Promise<boolean> {
		if (existsSync(`${PATHS.AVATAR}/${userId}.webp`)) {
			await fs.rm(`${PATHS.AVATAR}/${userId}.webp`);
			return true;
		}
		return false;
	}

	sendAvatar(res: Response, userId: string) {
		// Check if the user already has an avatar, if not display default one
		const avatarPath = existsSync(`${PATHS.AVATAR}/${userId}.webp`) ? userId : 'default-avatar';
		res.sendFile(`${PATHS.AVATAR}/${avatarPath}.webp`);
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The user's ID.
	  * @param {string} userId The user's ID.
	  * @param {string} filePath The user's ID.
	*/
	async sendThumbnail(res: Response, userId: string, filePath: string) {
		const file = await this.getByFilePath(userId, filePath);
		if (file == null) return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);

		// Get the mimeType of the file
		const fileName = file.name.slice(0, file.name.lastIndexOf('.'));
		if (file.mimetype == null) return res.sendFile(`${PATHS.THUMBNAIL}/missing-file-icon.png`);

		// Create folder (if needed to)
		const folder = file.path.split('/').slice(0, -1).join('/');
		const folderPath = `${PATHS.THUMBNAIL}/${userId}/${folder}`
		if (!existsSync(folderPath)) await fs.mkdir(`${PATHS.THUMBNAIL}/${userId}/${folder}`, { recursive: true });

		if (existsSync(`${folderPath}/${fileName}.jpg`)) {
			res.sendFile(`${folderPath}/${fileName}.jpg`);
		} else {
			await this.ThumbnailCreator.createThumbnail(file.userId, file.path);
			res.sendFile(`${folderPath}/${fileName}.jpg`);
		}
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The user's ID.
	  * @param {string} userId The user's ID.
	  * @param {string} filePath The user's ID.
	*/
	downloadFile(res: Response, userId: string, filePath: string) {
		res.download(path.join(PATHS.CONTENT, userId, filePath));
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The user's ID.
	  * @param {string} userId The user's ID.
	  * @param {string} filePath The user's ID.
	*/
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
			Error.GenericError(res, 'Failed to create archive');
		}
	}

	/**
	  * Send the thumbnail of the file.
	  * @param {Response} res The user's ID.
	  * @param {string} userId The user's ID.
	  * @param {string[]} filePaths The user's ID.
	*/
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
			Error.GenericError(res, 'Failed to create archive');
		}
	}

	async renameOnSystem(oldPath: string, newPath: string) {
		try {
			await fs.rename(oldPath, newPath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'EXDEV') {
				// Handle cross-device link error
				await this.copyFileOnSystem(oldPath, newPath);
				await this.deleteFileOnSystem(oldPath);
			}
		}
	}

	async createFolderOnSystem(folderPath: string, options?: Mode | MakeDirectoryOptions | null) {
		return fs.mkdir(folderPath, options);
	}

	async copyFileOnSystem(oldPath: string, newPath: string) {
		return fs.copyFile(oldPath, newPath, fs.constants.COPYFILE_EXCL);
	}

	async getNumberOfChildrenInFolder(folderPath: string) {
		const files = await fs.readdir(folderPath);
		return files.length;
	}

	async deleteFolderOnSystem(filePath: string) {
		return fs.rmdir(filePath, { recursive: true });
	}

	async deleteFileOnSystem(filePath: string) {
		return fs.unlink(filePath);
	}

	sendFile(res: Response, file: File, range?: string | undefined) {
		if (file.mimetype == null || file.mimetype == 'application/javascript') {
			const t = readFileSync(`${PATHS.CONTENT}/${file.userId}/${file.path}`, { encoding: 'utf-8' });
			res.type('text/plain');
			return res.send(t);
		}

		if (file.mimetype == 'application/pdf') return res.sendFile(`${PATHS.CONTENT}/${file.userId}/${file.path}`);

		// Check what type of file it is, to send the relevent data
		switch(file.mimetype.split('/')[0]) {
			case 'image':
				return res.sendFile(`${PATHS.CONTENT}/${file.userId}/${file.path}`);
			case 'video': {
				// Get video stats
				const videoSize = statSync(`${PATHS.CONTENT}/${file.userId}/${file.path}`).size;
				if (!range) {
					res.writeHead(200, {
						'content-length': videoSize + 1,
						'content-type': `${file.mimetype}`,
					});
					createReadStream(`${PATHS.CONTENT}/${file.userId}/${file.path}`).pipe(res);
				} else {
					// Send chunks of 2MB = 2 * (10 ** 6)
					const CHUNK_SIZE = 2 * (10 ** 6);
					const start = Number(range.replace(/\D/g, ''));
					const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

					// Create headers
					const contentLength = end - start + 1;
					const headers = {
						'content-range': `bytes ${start}-${end}/${videoSize}`,
						'accept-ranges': 'bytes',
						'content-length': contentLength,
						'content-type': `${file.mimetype}`,
						'range': `bytes ${start}-${end}/${videoSize}`,
					};

					// Stream content to user (use HTTP code 206 to indicate partial content)
					res.writeHead(206, headers);
					const videoStream = createReadStream(`${PATHS.CONTENT}/${file.userId}/${file.path}`, { start, end });
					videoStream.pipe(res);
				}
				break;
			}
			case 'text': {
				const t = readFileSync(`${PATHS.CONTENT}/${file.userId}/${file.path}`, { encoding: 'utf-8' });
				res.type('text/plain');
				return res.send(t);
			}
		}
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

	/**
	  * Retrieves the file system statistics
		* @returns {diskStorage} The disk storage data.
	*/
	getFileSystemStatistics(): diskStorage {
		return this.diskData;
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
}