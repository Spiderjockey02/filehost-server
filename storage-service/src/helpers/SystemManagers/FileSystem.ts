import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs';
import type { File } from '@prisma/client';
import { exec } from 'node:child_process';
import type { Response } from 'express';
import fs from 'node:fs/promises';
import archiver from 'archiver';
import path from 'node:path';
import util from 'node:util';
import { storageMediumSize, StorageProvider } from 'src/types';
import Client from '../Client';
import { FullFile } from 'src/types/database/File';
const cmd = util.promisify(exec);

/**
 * FileSystemManager class
 * @extends FileAccessor
 * @classdesc Manages file system operations, this is where to edit if you want other storage system supports (e.g. AWS S3, etc.)
 */
export default class FileSystemManager implements StorageProvider {
	diskData: storageMediumSize;
	basePath: string;
	client: Client;

	constructor(client: Client, basePath: string) {
		this.basePath = basePath;
		this.client = client;

		// Fetch disk data & update every 5 minutes
		this.diskData = { free: 0, total: 0 };
		this._fetchDiskData();
		setInterval(() => this._fetchDiskData(), 1000 * 60 * 10);
	}

	async downloadFile(res: Response, file: FullFile) {
		res.download(path.join(this.basePath, file.userId, file.id));
	}

	async downloadFiles(res: Response, userId: string, files: File[]) {
		const archive = archiver('zip', { zlib: { level: 9 } });
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');

		// Append files to archive
		archive.pipe(res);

		for (const file of files) {
			// Append file to archive
			if (file.type === 'FILE') {
				archive.file(path.join(this.basePath, userId, file.path), { name: file.path });
			} else {
				archive.directory(path.join(this.basePath, userId, file.path), file.name);
			}
		}

		await archive.finalize();
	}

	/**
	  * Copy a file on the system.
	  * @param {string} oldPath The old file path.
		* @param {string} newPath The new file path.
	*/
	async copyFileOnSystem(oldPath: string, newPath: string) {
		const cleanedOldPath = path.isAbsolute(oldPath) ? oldPath : path.join(this.basePath, oldPath);
		return fs.copyFile(cleanedOldPath, path.join(this.basePath, newPath), fs.constants.COPYFILE_EXCL);
	}

	/**
	  * Delete a file on the system.
	  * @param {string} filePath The file path.
	*/
	async deleteFileOnSystem(filePath: string) {
		const cleanedFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);
		if (existsSync(cleanedFilePath)) return fs.unlink(cleanedFilePath);
	}

	uploadFileToSystem(filePath: string) {
		const cleanedFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);
		return createWriteStream(cleanedFilePath);
	}

	/**
	  * Write a file to the system.
	  * @param {string} filePath The file path.
		* @param {Buffer | string} data The data to write to the file.
	*/
	async writeFileToSystem(filePath: string, data: Buffer | string) {
		const cleanedFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);
		return fs.writeFile(cleanedFilePath, data);
	}

	/**
	  * Read a file from the system.
	  * @param {string} filePath The file path.
		* @return {string} The data read from the file.
	*/
	async readFileFromSystem(file: File): Promise<Buffer>;
	async readFileFromSystem(file: File, encoding?: BufferEncoding): Promise<string>;
	async readFileFromSystem(file: File, encoding?: BufferEncoding): Promise<Buffer | string> {
		if (encoding) {
			return fs.readFile(path.join(this.basePath, file.userId, file.path), encoding);
		} else {
			return fs.readFile(path.join(this.basePath, file.userId, file.path));
		}
	}

	/**
	  * Send a file to the user.
	  * @param {Response} res The HTTP response object.
		* @param {File} file The file to send.
		* @param {string} [range] The range of the file to send.
	*/
	async sendFile(res: Response, file: File, range?: string | undefined) {
		const filePath = path.join(this.basePath, file.userId, file.path);
		const mime = file.mimetype || 'application/octet-stream';

		try {
			if (mime.startsWith('video')) {
				const stat = statSync(filePath);
				const fileSize = stat.size;
				const totalFileSize = Math.min(fileSize, Number(file.size));

				if (range) {
					const CHUNK_SIZE = 10 * 10 ** 6;
					const match = range.match(/bytes=(\d+)-(\d*)/);
					if (!match) throw new Error('Invalid Range header');
					const start = parseInt(match[1], 10);
					const end = match[2] ? Math.min(parseInt(match[2], 10), totalFileSize - 1) : Math.min(start + CHUNK_SIZE - 1, totalFileSize - 1);

					const headers = {
						'Content-Range': `bytes ${start}-${end}/${totalFileSize}`,
						'Accept-Ranges': 'bytes',
						'Content-Length': end - start + 1,
						'Content-Type': mime,
					};

					res.writeHead(206, headers);
					createReadStream(filePath, { start, end }).pipe(res);
				} else {
					res.writeHead(200, {
						'Content-Length': totalFileSize,
						'Content-Type': mime,
					});
					createReadStream(filePath).pipe(res);
				}
			} else {
				// Default for images, text, pdf, etc.
				res.type(mime);
				createReadStream(filePath).pipe(res);
			}
		} catch (err) {
			console.error('Error in sendFile:', err);
			res.status(500).send('Internal server error.');
		}
	}

	async checkFileExists(filePath: string) {
		const cleanedFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);
		return existsSync(cleanedFilePath);
	}

	async verifyConnection() {
		try {
			await fs.access(this.basePath);
			return true;
		} catch (err) {
			this.client.logger.error(err);
			return false;
		}
	}

	/**
	  * Fetches disk data
	*/
	private async _fetchDiskData() {
		const platform = process.platform;
		try {
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
		} catch (err) {
			this.client.logger.error(err);
			this.diskData = {
				free: 0,
				total: 0,
			};
		}
	}

	/**
	  * Retrieves the file system statistics
		* @returns {diskStorage} The disk storage data.
	*/
	getFileSystemStatistics(): storageMediumSize {
		return this.diskData;
	}

	/**
		* Ensures the path is within the user's directory
		* @param {string} userId The user's ID.
		* @param {string} filePath How file path.
	*/
	_verifyTraversal(userId: string, filePath: string) {
		const userBasePath = path.resolve(this.basePath, userId);
		const targetPath = path.resolve(filePath);
		return targetPath.startsWith(userBasePath);
	}
}