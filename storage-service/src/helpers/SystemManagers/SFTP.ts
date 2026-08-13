import type { SFTPOptions, StorageProvider } from '@/types';
import { PassThrough, Readable, Writable } from 'stream';
import type { File } from '@/types/generated/client';
import type Client from '@/helpers/Client';
import SFTPClient from 'ssh2-sftp-client';
import { parseSFTPUrl } from '@/utils';
import { promisify } from 'node:util';
import { ZipArchive } from 'archiver';
import { Response } from 'express';
import strm from 'stream';
import path from 'path';
const pipeline = promisify(strm.pipeline);

export default class SFTPManager implements StorageProvider {
	client: Client;
	isOnline: boolean;
	SFTPClient: SFTPClient;
	config: SFTPOptions;

	constructor(client: Client, url: string) {
		this.isOnline = true;
		this.client = client;
		this.SFTPClient = new SFTPClient();
		this.config = parseSFTPUrl(url);
	}

	async downloadFile(res: Response, file: File) {
		this.client.logger.debug(`[SFTP Client]: Downloading file: ${file.id}`);
		const key = `${file.userId}/${file.id}`;
		const pass = new PassThrough();
		const getPromise = this.SFTPClient.get(key, pass);
		res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
		res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');

		pass.pipe(res);
		await getPromise;
	}

	async downloadFiles(res: Response, files: File[]) {
		this.client.logger.debug(`[SFTP Client]: Downloading ${files.length} files.`);
		const archive = new ZipArchive({ zlib: { level: 9 } });
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
		archive.pipe(res);

		for (const file of files) {
			const key = `${file.userId}/${file.id}`;
			const pass = new PassThrough();
			const getPromise = this.SFTPClient.get(key, pass);

			archive.append(pass, { name: file.path });
			await getPromise;
		}

		await archive.finalize();
	}

	async copyFile(oldFileId: string, newFileId: string) {
		this.client.logger.debug(`[SFTP Client]: Copying file: ${oldFileId}`);

		const readStream = new PassThrough();
		const getPromise = this.SFTPClient.get(oldFileId, readStream);
		await this.SFTPClient.put(readStream, newFileId);
		await getPromise;
	}

	async deleteFile(fileId: string) {
		this.client.logger.debug(`[S3 Client]: Deleting file from system: ${fileId}`);
		await this.SFTPClient.delete(fileId);
	}

	uploadFile(filePath: string): { stream: Writable; done: Promise<void>; } {
		this.client.logger.debug(`[SFTP Client]: Starting upload for file: ${filePath}`);
		const pass = new PassThrough();

		const uploadPromise = (async () => {
			try {
				await this.SFTPClient.mkdir(path.dirname(filePath), true);
				await this.SFTPClient.put(pass as Readable, filePath);
				this.client.logger.debug(`[SFTP Client]: Upload completed for file: ${filePath}`);
			} catch (err) {
				this.client.logger.error(`[SFTP Client] Error uploading file ${filePath}: ${err}`);
				throw err;
			}
		})();

		return { stream: pass, done: uploadPromise };
	}

	async writeFile(filePath: string, data: Buffer | string) {
		try {
			let totalSize = 0;
			let uploaded = 0;
			let dataStream: Readable;

			if (typeof data === 'string' || Buffer.isBuffer(data)) {
				const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
				totalSize = buffer.length;
				dataStream = Readable.from(buffer);
			} else {
				throw new Error('[SFTP Client]: Unsupported data type for writeFile');
			}

			dataStream.on('data', (chunk) => {
				uploaded += chunk.length;
				if (totalSize > 0) {
					const percent = ((uploaded / totalSize) * 100).toFixed(2);
					this.client.logger.debug(
						`[SFTP Client]: Writing file: ${filePath} (${percent}%)`,
					);
				}
			});

			await this.SFTPClient.mkdir(path.dirname(filePath), true);
			await this.SFTPClient.put(dataStream, filePath);
			this.client.logger.debug(`[SFTP Client]: Write completed for file: ${filePath}`);
		} catch (err) {
			this.client.logger.error(`[SFTP Client] Error writing file ${filePath}: ${err}`);
			throw err;
		}
	}

	async readFile(file: File): Promise<Buffer>;
	async readFile(file: File, encoding?: BufferEncoding): Promise<string>;
	async readFile(file: File, encoding?: BufferEncoding): Promise<string | Buffer> {
		this.client.logger.debug(`[SFTP Client]: Reading file: ${file.id}`);
		const key = `${file.userId}/${file.id}`;
		const data = await this.SFTPClient.get(key);

		let buffer: Buffer;
		if (Buffer.isBuffer(data)) {
			buffer = data;
		} else if (data instanceof Readable) {
			const chunks: Buffer[] = [];
			for await (const chunk of data) {
				chunks.push(chunk);
			}
			buffer = Buffer.concat(chunks);
		} else {
			throw new Error('[SFTP Client]: Unexpected return type from sftpClient.get()');
		}

		return encoding ? buffer.toString(encoding) : buffer;
	}

	async sendFile(res: Response, file: File, range?: string): Promise<void> {
		this.client.logger.debug(`[SFTP Client]: Sending file: ${file.id} (${file.mimetype})`);
		const key = `${file.userId}/${file.id}`;
		const stats = await this.SFTPClient.stat(key);
		const fileSize = stats.size;

		if (file.mimetype?.startsWith('video')) {
			if (range) {
				const CHUNK_SIZE = 10 * 10 ** 6;
				const match = range.match(/bytes=(\d+)-(\d*)/);
				if (!match) throw new Error('Invalid Range header');

				// Verify range match
				const [, startValue, endValue] = match;
				if (!startValue) throw new Error('Invalid Range header');
				const start = Number.parseInt(startValue, 10);
				const end = endValue ? Math.min(parseInt(endValue, 10), fileSize - 1) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

				// Create read stream to client
				const stream = this.SFTPClient.createReadStream(key, { start, end });
				res.writeHead(206, {
					'Content-Range': `bytes ${start}-${end}/${fileSize}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': end - start + 1,
					'Content-Type': file.mimetype ?? 'application/octet-stream',
				});

				await pipeline(stream, res);
				this.client.logger.debug(`[SFTP Client]: Streamed video range ${start}-${end}`);
				return;
			}
		}

		const stream = this.SFTPClient.createReadStream(key);
		res.writeHead(200, {
			'Content-Type': file.mimetype ?? 'application/octet-stream',
			'Content-Length': fileSize ?? 0,
		});

		await pipeline(stream, res);
		this.client.logger.debug(`[SFTP Client]: Completed streaming file: ${file.id}`);
	}

	async checkFileExists(filePath: string): Promise<boolean> {
		this.client.logger.debug(`[SFTP Client]: Checking if file exists: ${filePath}`);

		try {
			await this.SFTPClient.stat(filePath);
			return true;
		} catch (err: any) {
			if (err.code === 2 || err.message?.includes('No such file')) return false;
			throw err;
		}
	}

	async verifyConnection() {
		try {
			// Make sure not to try and reconnect if connection is already made
			if ((this.SFTPClient as any).sftp) {
				this.client.logger.debug('[SFTP Client]: Already connected, skipping reconnect.');
				this.isOnline = true;
				return true;
			}

			await this.SFTPClient.connect({
				host: this.config.host,
				port: this.config.port,
				username: this.config.username,
				password: this.config.password ?? '',
			});
			this.isOnline = true;
			return true;
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