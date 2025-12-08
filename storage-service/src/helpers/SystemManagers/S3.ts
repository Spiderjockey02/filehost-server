import { S3Client, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command, HeadObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import type { FullFile } from '@/types/database/File';
import type { File } from '@/types/generated/client';
import type { StorageProvider } from '@/types';
import { Upload } from '@aws-sdk/lib-storage';
import type Client from '@/helpers/Client';
import { PassThrough } from 'node:stream';
import type { Response } from 'express';
import { promisify } from 'node:util';
import { parseS3Url } from '@/utils';
import archiver from 'archiver';
import stream from 'stream';
const pipeline = promisify(stream.pipeline);

export default class S3Manager implements StorageProvider {
	client: Client;
	isOnline: boolean;
	private s3: S3Client;
	private bucketName: string;

	constructor(client: Client, url: string) {
		const config = parseS3Url(url);
		this.isOnline = true;

		this.bucketName = config.bucket;
		this.s3 = new S3Client({
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			endpoint: config.endpoint,
		});
		this.client = client;
	}

	async downloadFile(res: Response, file: FullFile) {
		this.client.logger.debug(`[S3 Client]: Downloading file: ${file.id}`);
		const key = `${file.userId}/${file.id}`;
		const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
		const s3Response = await this.s3.send(command);
		res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
		if (s3Response.Body) await pipeline(s3Response.Body.transformToWebStream(), res);
	}

	async downloadFiles(res: Response, files: File[]) {
		this.client.logger.debug(`[S3 Client]: Downloading ${files.length} files.`);
		const archive = archiver('zip', { zlib: { level: 9 } });
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
		archive.pipe(res);

		for (const file of files) {
			const key = `${file.userId}/${file.id}`;
			const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
			const s3Response = await this.s3.send(command);
			if (s3Response.Body) {
				archive.append(s3Response.Body as stream.Readable, { name: file.path });
			}
		}

		await archive.finalize();
	}

	async copyFile(oldFileId: string, newFileId: string) {
		this.client.logger.debug(`[S3 Client]: Copying file: ${oldFileId}`);

		const command = new CopyObjectCommand({
			Bucket: this.bucketName,
			CopySource: `${this.bucketName}/${oldFileId}`,
			Key: newFileId,
		});
		await this.s3.send(command);
	}

	async deleteFile(fileId: string) {
		this.client.logger.debug(`[S3 Client]: Deleting file from system: ${fileId}`);
		await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: fileId }));
	}

	uploadFile(filePath: string) {
		this.client.logger.debug(`[S3 Client]: Starting upload for file: ${filePath}`);
		const pass = new PassThrough();

		const upload = new Upload({
			client: this.s3,
			params: {
				Bucket: this.bucketName,
				Key: filePath,
				Body: pass,
			},
		});

		upload.on('httpUploadProgress', (progress) => {
			if (progress.total && progress.loaded) {
				this.client.logger.debug(`[S3 Client]: Uploading file: ${filePath} (${(progress.loaded / progress.total * 100).toFixed(2)}%)`);
			}
		});

		const uploadPromise = upload.done().catch(err => {
			this.client.logger.error(`[S3 Client] Error: ${err}`);
		}).then(() => null) as Promise<void>;

		return { stream: pass, done: uploadPromise };
	}

	async writeFile(filePath: string, data: Buffer | string) {
		this.client.logger.debug(`[S3 Client]: Starting write for file: ${filePath}`);
		const upload = new Upload({
			client: this.s3,
			params: {
				Bucket: this.bucketName,
				Key: filePath,
				Body: data,
			},
		});

		upload.on('httpUploadProgress', (progress) => {
			if (progress.total && progress.loaded) {
				this.client.logger.debug(`[S3 Client]: Starting write for file: ${filePath} (${(progress.loaded / progress.total * 100).toFixed(2)}%)`);
			}
		});

		await upload.done();
	}

	async readFile(file: File): Promise<Buffer>;
	async readFile(file: File, encoding?: BufferEncoding): Promise<string>;
	async readFile(file: File, encoding?: BufferEncoding): Promise<string | Buffer> {
		this.client.logger.debug(`[S3 Client]: Reading file: ${file.id}`);
		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: `${file.userId}/${file.id}`,
			Range: (file.mimetype == null || !file.mimetype.split('/')[0].startsWith('video')) ? undefined : `bytes=${0}-${5 * 1024 * 1024}`,
		 });
		const s3Response = await this.s3.send(command);
		const chunks: Buffer[] = [];
		if (s3Response.Body) {
			for await (const chunk of s3Response.Body as stream.Readable) {
				chunks.push(chunk);
			}
		}
		const buffer = Buffer.concat(chunks);
		return encoding ? buffer.toString(encoding) : buffer;
	}

	async sendFile(res: Response, file: File, range?: string) {
		this.client.logger.debug(`[S3 Client]: Sending file: ${file.id} (${file.mimetype})`);
		const key = `${file.userId}/${file.id}`;
		const head = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));
		const fileSize = Number(head.ContentLength || 0);

		if (file.mimetype?.startsWith('video')) {
			if (range) {
				const CHUNK_SIZE = 10 * 10 ** 6;
				const match = range.match(/bytes=(\d+)-(\d*)/);
				if (!match) throw new Error('Invalid Range header');
				const start = parseInt(match[1], 10);
				const end = match[2] ? Math.min(parseInt(match[2], 10), fileSize - 1) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

				const command = new GetObjectCommand({
					Bucket: this.bucketName,
					Key: key,
					Range: `bytes=${start}-${end}`,
				});

				const result = await this.s3.send(command);
				if (result.Body) {
					res.writeHead(206, {
						'Content-Range': `bytes ${start}-${end}/${fileSize}`,
						'Accept-Ranges': 'bytes',
						'Content-Length': end - start + 1,
						'Content-Type': file.mimetype ?? 'application/octet-stream',
					});
					await pipeline(result.Body as stream.Readable, res);
				}
			} else {
				const command = new GetObjectCommand({
					Bucket: this.bucketName,
					Key: key,
				});
				const result = await this.s3.send(command);
				if (result.Body) {
					res.writeHead(200, {
						'Content-Type': file.mimetype ?? 'application/octet-stream',
						'Content-Length': fileSize ?? 0,
					});
					await pipeline(result.Body as stream.Readable, res);
				}
			}
		} else {
			const streamCommand = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
			const result = await this.s3.send(streamCommand);
			if (result.Body) {
				res.writeHead(200, {
					'Content-Type': file.mimetype ?? 'application/octet-stream',
					'Content-Length': fileSize ?? 0,
				});
				await pipeline(result.Body as stream.Readable, res);
			}
		}
	}

	async checkFileExists(filePath: string) {
		this.client.logger.debug(`[S3 Client]: Checking if file exist: ${filePath}`);
		try {
			await this.s3.send(
				new HeadObjectCommand({
					Bucket: this.bucketName,
					Key: filePath,
				}),
			);
			return true;
		} catch (err) {
			if (err instanceof S3ServiceException) {
				// If the error is that the object does not exist, return false
				if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return false;
			}
			// Rethrow other unexpected errors
			throw err;
		}
	}

	async verifyConnection() {
		this.client.logger.debug('[S3 Client]: Verifying connection');
		try {
			const command = new ListObjectsV2Command({
				Bucket: this.bucketName,
				MaxKeys: 1,
			});
			await this.s3.send(command);
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
