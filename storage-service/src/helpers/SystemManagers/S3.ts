import { S3Client, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import type { File } from '@prisma/client';
import archiver from 'archiver';
import type { Response } from 'express';
import stream from 'stream';
import path from 'node:path';
import { promisify } from 'node:util';
import { storageMediumSize, StorageProvider } from 'src/types';
import { parseS3Url } from '../../utils';
const pipeline = promisify(stream.pipeline);
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'node:stream';

export default class S3Manager implements StorageProvider {
	diskData: storageMediumSize;
	private s3: S3Client;
	private bucketName: string;

	constructor(url: string) {
		const config = parseS3Url(url);

		this.bucketName = config.bucket;
		this.s3 = new S3Client({
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			endpoint: config.endpoint,
			forcePathStyle: config.forcePathStyle,
		});
		this.diskData = { free: 0, total: 0 };
	}

	private getKey(userId: string, filePath: string): string {
		return path.join(userId, filePath);
	}

	async downloadFile(res: Response, userId: string, filePath: string) {
		const key = this.getKey(userId, filePath);
		const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
		const s3Response = await this.s3.send(command);
		res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
		if (s3Response.Body) await pipeline(s3Response.Body as stream.Readable, res);
	}

	async downloadFiles(res: Response, userId: string, files: File[]) {
		const archive = archiver('zip', { zlib: { level: 9 } });
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
		archive.pipe(res);

		for (const file of files) {
			const key = this.getKey(userId, file.path);
			const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
			const s3Response = await this.s3.send(command);
			if (s3Response.Body) {
				archive.append(s3Response.Body as stream.Readable, { name: file.path });
			}
		}

		await archive.finalize();
	}

	async downloadDirectory(res: Response, userId: string, folderPath: string) {
		const prefix = this.getKey(userId, folderPath).replace(/\/+$/, '') + '/';
		const command = new ListObjectsV2Command({ Bucket: this.bucketName, Prefix: prefix });
		const { Contents } = await this.s3.send(command);
		const archive = archiver('zip', { zlib: { level: 9 } });

		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename="${path.basename(folderPath)}.zip"`);
		archive.pipe(res);

		for (const obj of Contents || []) {
			const fileKey = obj.Key!;
			const relativePath = fileKey.slice(prefix.length);
			const fileCommand = new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey });
			const s3Response = await this.s3.send(fileCommand);
			if (s3Response.Body) {
				archive.append(s3Response.Body as stream.Readable, { name: relativePath });
			}
		}

		await archive.finalize();
	}

	async renameOnSystem(oldPath: string, newPath: string) {
		await this.copyFileOnSystem(oldPath, newPath);
		await this.deleteFileOnSystem(oldPath);
	}

	async createFolderOnSystem(): Promise<void> {
		// No-op in S3 since folders are logical.
	}

	async copyFileOnSystem(oldPath: string, newPath: string) {
		const copySource = `${this.bucketName}/${oldPath}`;
		const command = new CopyObjectCommand({
			Bucket: this.bucketName,
			CopySource: copySource,
			Key: newPath,
		});
		await this.s3.send(command);
	}

	async getNumberOfChildrenInFolder(folderPath: string): Promise<number> {
		const command = new ListObjectsV2Command({
			Bucket: this.bucketName,
			Prefix: folderPath.endsWith('/') ? folderPath : `${folderPath}/`,
		});
		const { Contents } = await this.s3.send(command);
		return Contents?.length ?? 0;
	}

	async deleteFolderOnSystem(folderPath: string) {
		const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
		const list = await this.s3.send(new ListObjectsV2Command({ Bucket: this.bucketName, Prefix: prefix }));
		if (list.Contents) {
			await Promise.all(list.Contents.map(obj =>
				this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: obj.Key! })),
			));
		}
	}

	async deleteFileOnSystem(filePath: string) {
		await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: filePath }));
	}

	uploadFileToSystem(userId: string, fileName: string) {
		const pass = new PassThrough();

		const upload = new Upload({
			client: this.s3,
			params: {
				Bucket: this.bucketName,
				Key: `uploads/${userId}/${fileName}`,
				Body: pass,
			},
		});

		upload.on('httpUploadProgress', (progress) => {
			if (progress.total && progress.loaded) {
				console.log(`Progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
			}
		});

		upload.done().catch(err => {
			console.error('S3 upload error:', err);
		});

		return pass;
	}

	async writeFileToSystem(filePath: string, data: Buffer | string) {
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
				console.log(`Progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
			}
		});

		await upload.done();
	}

	async readFileFromSystem(file: File): Promise<Buffer>;
	async readFileFromSystem(file: File, encoding?: BufferEncoding): Promise<string>;
	async readFileFromSystem(file: File, encoding?: BufferEncoding): Promise<string | Buffer> {
		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: this.getKey(file.userId, file.path),
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
		try {
			const key = this.getKey(file.userId, file.path);
			const head = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));
			const totalFileSize = Math.min(Number(head.ContentLength), Number(file.size));

			if (file.mimetype?.startsWith('video')) {
				if (range) {
					const CHUNK_SIZE = 10 * 10 ** 6;
					const match = range.match(/bytes=(\d+)-(\d*)/);
					if (!match) throw new Error('Invalid Range header');
					const start = parseInt(match[1], 10);
					const end = match[2] ? Math.min(parseInt(match[2], 10), totalFileSize - 1) : Math.min(start + CHUNK_SIZE - 1, totalFileSize - 1);

					const command = new GetObjectCommand({
						Bucket: this.bucketName,
						Key: key,
						Range: `bytes=${start}-${end}`,
					});

					const result = await this.s3.send(command);
					if (result.Body) {
						res.writeHead(206, {
							'Content-Range': `bytes ${start}-${end}/${totalFileSize}`,
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
							'Content-Length': totalFileSize ?? 0,
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
						'Content-Length': totalFileSize ?? 0,
					});
					await pipeline(result.Body as stream.Readable, res);
				}
			}

		} catch (err: any) {
			if (err.code !== 'ERR_STREAM_PREMATURE_CLOSE') console.error('Pipeline error:', err);
			if (!res.headersSent) {
				res.status(404).send('File not found or inaccessible');
			} else {
				res.destroy();
			}
		}
	}

	async checkFileExists(filePath: string) {
		try {
			await this.s3.send(
				new HeadObjectCommand({
					Bucket: this.bucketName,
					Key: filePath,
				}),
			);
			return true;
		} catch (err: any) {
		// If the error is that the object does not exist, return false
			if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
				return false;
			}
			// Rethrow other unexpected errors
			throw err;
		}
	}

	getFileSystemStatistics() {
		return { free: 0, total: 0 };
	}

	_verifyTraversal(userId: string, filePath: string) {
		return filePath.startsWith(userId + '/');
	}
}
