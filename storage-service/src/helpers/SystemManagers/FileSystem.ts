import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import type { FullFile } from '@/types/database/File';
import type { File } from '@/types/generated/client';
import type { StorageProvider } from '@/types';
import type Client from '@/helpers/Client';
import type { Response } from 'express';
import fs from 'node:fs/promises';
import archiver from 'archiver';
import path from 'node:path';

export default class FileSystemManager implements StorageProvider {
	basePath: string;
	client: Client;
	isOnline: boolean;

	constructor(client: Client, basePath: string) {
		this.basePath = basePath;
		this.client = client;
		this.isOnline = true;
	}

	async downloadFile(res: Response, file: FullFile) {
		this.client.logger.debug(`[FS Client]: Downloading file: ${file.id}`);
		res.download(path.join(this.basePath, file.userId, file.id));
	}

	async downloadFiles(res: Response, files: File[]) {
		this.client.logger.debug(`[FS Client]: Downloading ${files.length} files.`);
		const archive = archiver('zip', { zlib: { level: 9 } });
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
		archive.pipe(res);

		for (const file of files) {
			if (file.type === 'FILE') {
				archive.file(path.join(this.basePath, file.userId, file.id), { name: file.id });
			} else {
				archive.directory(path.join(this.basePath, file.userId, file.id), file.name);
			}
		}

		await archive.finalize();
	}

	async copyFile(oldFileId: string, newFileId: string) {
		this.client.logger.debug(`[FS Client]: Copying file: ${oldFileId}`);
		const cleanedOldPath = path.isAbsolute(oldFileId) ? oldFileId : path.join(this.basePath, oldFileId);
		return fs.copyFile(cleanedOldPath, path.join(this.basePath, newFileId), fs.constants.COPYFILE_EXCL);
	}

	async deleteFile(filePath: string) {
		this.client.logger.debug(`[FS Client]: Deleting file from system: ${filePath}`);
		const cleanedFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);
		if (existsSync(cleanedFilePath)) return fs.unlink(cleanedFilePath);
	}

	uploadFile(filePath: string) {
		this.client.logger.debug(`[S3 Client]: Starting upload for file: ${filePath}`);
		const cleanedFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);

		const dir = path.dirname(cleanedFilePath);
	 	mkdirSync(dir, { recursive: true });
		const stream = createWriteStream(cleanedFilePath);

		// Create a Promise that resolves when the file is fully written
		const done = new Promise<void>((resolve, reject) => {
			stream.on('finish', resolve);
			stream.on('error', reject);
		});

		return { stream, done };
	}

	async writeFile(filePath: string, data: Buffer | string) {
		this.client.logger.debug(`[FS Client]: Starting write for file: ${filePath}`);
		const cleanedFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);

		const dir = path.dirname(cleanedFilePath);
		await fs.mkdir(dir, { recursive: true });
		return fs.writeFile(cleanedFilePath, data);
	}

	async readFile(file: File): Promise<Buffer>;
	async readFile(file: File, encoding?: BufferEncoding): Promise<string>;
	async readFile(file: File, encoding?: BufferEncoding): Promise<Buffer | string> {
		this.client.logger.debug(`[FS Client]: Reading file: ${file.id}`);
		if (encoding) {
			return fs.readFile(path.join(this.basePath, file.userId, file.id), encoding);
		} else {
			return fs.readFile(path.join(this.basePath, file.userId, file.id));
		}
	}

	async sendFile(res: Response, file: File, range?: string | undefined) {
		this.client.logger.debug(`[FS Client]: Sending file: ${file.id}`);
		const filePath = path.join(this.basePath, file.userId, file.id);
		const mime = file.mimetype || 'application/octet-stream';

		await fs.access(filePath);
		if (mime.startsWith('video')) {
			const stat = statSync(filePath);
			const fileSize = stat.size;

			if (range) {
				const CHUNK_SIZE = 10 * 10 ** 6;
				const match = range.match(/bytes=(\d+)-(\d*)/);
				if (!match) throw new Error('Invalid Range header');
				const start = parseInt(match[1], 10);
				const end = match[2] ? Math.min(parseInt(match[2], 10), fileSize - 1) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

				const headers = {
					'Content-Range': `bytes ${start}-${end}/${fileSize}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': end - start + 1,
					'Content-Type': mime,
				};

				res.writeHead(206, headers);
				createReadStream(filePath, { start, end }).pipe(res);
			} else {
				res.writeHead(200, {
					'Content-Length': fileSize,
					'Content-Type': mime,
				});
				createReadStream(filePath).pipe(res);
			}
		} else {
			res.type(mime);
			createReadStream(filePath).pipe(res);
		}
	}

	async checkFileExists(filePath: string) {
		this.client.logger.debug(`[FS Client]: Checking if file exist: ${filePath}`);
		const cleanedFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);
		return existsSync(cleanedFilePath);
	}

	async verifyConnection() {
		this.client.logger.debug('[FS Client]: Verifying connection');
		try {
			await fs.access(this.basePath);
			this.isOnline = true;
			return this.isOnline;
		} catch (err) {
			this.client.logger.error(err);
			this.isOnline = false;

			// As it failed check in 5 minutes again, if it's back online
			setTimeout(() => {
				this.verifyConnection();
			}, 5 * 60 * 1000);
			return this.isOnline;
		}
	}
}