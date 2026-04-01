import FileManager from '../helpers/SystemManagers/FileOperationManager';
import type { File, StorageMedium } from '@/types/generated/client';
import { pipeline as _pipeline, Readable } from 'node:stream';
import { handleFFMPEGEncoding } from '../media/Streams';
import { exec, spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import type Client from '../helpers/Client';
import { randomUUID } from 'node:crypto';
import { createCanvas } from 'canvas';
import { join } from 'node:path';
import { promisify } from 'util';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
const pipeline = promisify(_pipeline);

export default class ThumbnailCreator {
	fileExtension: string;
	SystemManager: FileManager;
	client: Client;

	constructor(fileSystemManager: FileManager) {
		this.fileExtension = 'webp';
		this.SystemManager = fileSystemManager;
		this.client = fileSystemManager.client;
	}

	/**
	  * Create a thumbnail for the given file.
	  * @param {File} file The file object
	*/
	async createThumbnail(file: File) {
		this.client.logger.debug(`Creating thumbnail for file ${file.id} with mimetype ${file.mimetype}`);
		// Check if mimetype is null (indicates folder)
		if (file.mimetype == null) return;

		// Check for generic file types
		switch (file.mimetype.split('/')[0]) {
			case 'image':
				return this.createFromImage(file);
			case 'video':
				return this.createFromVideo(file);
			case 'text':
				return this.generateTextThumbnail(file);
		}

		switch (file.mimetype) {
			case 'application/json':
			case 'application/xml':
			case 'application/javascript':
			case 'application/x-httpd-php':
			case 'application/x-yaml':
			case 'application/rtf':
				return this.generateTextThumbnail(file);
			case 'application/pdf':
				return this.createFromPDF(file);
			case 'application/msword':
			case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
		  case 'application/vnd.oasis.opendocument.text':
			case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
			case 'application/vnd.oasis.opendocument.presentation':
			case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
			case 'application/vnd.oasis.opendocument.spreadsheet':
			case 'application/vnd.ms-excel':
			case 'application/vnd.ms-powerpoint':
			case 'application/rtf':
			case 'application/vnd.apple.pages':
			case 'application/vnd.apple.numbers':
			case 'application/vnd.apple.keynote':
				return this.createFromDoc(file);
		}
	}

	/**
	  * Create a thumbnail from a given image
	  * @param {File} file The file object
	*/
	private async createFromImage(file: File) {
		try {
			const fileProvider = await this.SystemManager.storageManager.getProviderById(file.storageId);
			const buffer = await fileProvider.readFile(file);
			const { stream: outputStream, done } = fileProvider.uploadFile(`${file.userId}/thumbnails/${file.id}.${this.fileExtension}`);

			await new Promise((resolve, reject) => {
				const transformer = sharp(buffer)
					.resize(this.client.config.get('THUMBNAIL.WIDTH'), this.client.config.get('THUMBNAIL.HEIGHT'), {
						fit: 'cover',
						background: { r: 0, g: 0, b: 0 },
					})
					.jpeg({ quality: 90 });

				transformer.on('error', reject);
				outputStream.on('error', reject);
				outputStream.on('finish', resolve);

				// Save thumbnail to file system
				transformer.pipe(outputStream);
			});
			await done;
		} catch (err) {
			this.client.logger.error(`Error creating image thumbnail: ${err}`);
		}
	}

	/**
	  * Create a thumbnail from a given video
	  * @param {File} file The file object
	*/
	private async createFromVideo(file: File) {
		try {
			const fileProvider = await this.SystemManager.storageManager.getProviderById(file.storageId);
			const buffer = await fileProvider.readFile(file);
			const { stream: outputStream, done } = fileProvider.uploadFile(`${file.userId}/thumbnails/${file.id}.${this.fileExtension}`);
			const partialBuffer = buffer.subarray(0, 5 * 1024 * 1024);
			const stream = Readable.from(partialBuffer);

			await handleFFMPEGEncoding([
				'-analyzeduration', '1000M',
				'-probesize', '1000M',
				'-i', 'pipe:0',
				'-ss', '00:00:00.750',
				'-vframes', '1',
				'-vf', `scale=${this.client.config.get('THUMBNAIL.WIDTH')}:${this.client.config.get('THUMBNAIL.HEIGHT')}:force_original_aspect_ratio=decrease,pad=${this.client.config.get('THUMBNAIL.WIDTH')}:${this.client.config.get('THUMBNAIL.HEIGHT')}: (ow-iw)/2:(oh-ih)/2`,
				'-f', 'image2pipe',
				'pipe:1',
			], stream, outputStream);
			await done;
		} catch(err) {
			this.client.logger.error(`Error creating video thumbnail: ${err}`);
		}
	}

	/**
	  * Create a thumbnail from a given PDF
	  * @param {File} file The file object
	*/
	private async createFromPDF(file: File) {
		try {
			const fileProvider = await this.SystemManager.storageManager.getProviderById(file.storageId);
			const { stream: outputStream, done } = fileProvider.uploadFile(`${file.userId}/thumbnails/${file.id}.${this.fileExtension}`);
			const gsBinary = process.platform === 'win32' ? 'gswin64c' : 'gs';

			const gs = spawn(gsBinary, [
				'-q', '-dQUIET',
				'-dNOPAUSE', '-dBATCH',
				'-sDEVICE=jpeg',
				'-dFirstPage=1',
				'-dLastPage=1',
				'-dJPEGQ=100',
				'-r300',
				`-g${this.client.config.get('THUMBNAIL.WIDTH')}x${this.client.config.get('THUMBNAIL.HEIGHT')}`,
				'-dPDFFitPage',
				'-sOutputFile=%stdout',
				'-_',
			]);

			gs.stderr.on('data', data => this.client.logger.error(`[Ghostscript] ${data.toString()}`));
			gs.stdin.on('error', err => this.client.logger.warn(`Ghostscript stdin error: ${err.message}`));

			await Promise.all([
				pipeline(Readable.from(await fileProvider.readFile(file)), gs.stdin),
				pipeline(gs.stdout, outputStream),
			]);

			await new Promise((resolve, reject) => {
				gs.on('close', code => {
					if (code === 0) resolve(null);
					else reject(new Error(`Ghostscript exited with code ${code}`));
				});
			});
			await done;
		} catch (err) {
			this.client.logger.error(`Error creating PDF thumbnail: ${err}`);
		}
	}

	/**
	  * Create a thumbnail from a given document-based file
	  * @param {File} file The file object
	*/
	private async createFromDoc(file: File) {
		try {
			const storageMedium = await this.SystemManager.storageManager.fetchById(file.storageId) as StorageMedium;
			const fileProvider = await this.SystemManager.storageManager.getProviderById(file.storageId);

			// As FILE_SYSTEM is local, no need to make temp file and stream
			if (storageMedium.type == 'FILE_SYSTEM') {
				// Convert the document to PDF using LibreOffice
				const folder = join(storageMedium.basePath, file.userId, file.path.substring(0, file.path.lastIndexOf('/')));
				await new Promise((resolve, reject) => {
					exec(`"${process.env.LIBREOFFICE_PATH}" --headless --convert-to "pdf:writer_pdf_Export" "${join(storageMedium.basePath, file.userId, file.path)}" --outdir "${folder}"`, (err) => {
						if (err) reject(err);
						else resolve(null);
					});
				});
			} else {
				// Make temp file, use that, delete temp file
				const buffer = await fileProvider.readFile(file);
				const tempInputPath = join(tmpdir(), `${randomUUID()}.${file.path.split('.').pop()!}`);
				await pipeline(Readable.from(buffer), createWriteStream(tempInputPath));

				await new Promise((resolve, reject) => {
					exec(`"${process.env.LIBREOFFICE_PATH}" --headless --convert-to "pdf:writer_pdf_Export" "${tempInputPath}" --outdir "${tmpdir()}"`, (err, stderr) => {
						if (err) {
							this.client.logger.error(`LibreOffice stderr: ${stderr}`);
							return reject(err);
						}
						resolve(null);
					},
					);
				});
			}

			// Now convert the PDF to an image
			await this.createFromPDF({ ...file, path: file.path.replace(/\.[^/.]+$/, '.pdf') });

			// Delete the PDF file
			await fileProvider.deleteFile(`/${file.userId}/${file.path.replace(/\.[^/.]+$/, '')}.pdf`);
		} catch (err) {
			this.client.logger.error(`Error creating document thumbnail: ${err}`);
		}
	}

	/**
	  * Create a thumbnail from a given text file
	  * @param {File} file The file object
	*/
	private async generateTextThumbnail(file: File) {
		try {
			const fileProvider = await this.SystemManager.storageManager.getProviderById(file.storageId);
			const text = await fileProvider.readFile(file, 'utf-8');
			// Canvas setup
			const canvas = createCanvas(this.client.config.get('THUMBNAIL.WIDTH'), this.client.config.get('THUMBNAIL.HEIGHT'));
			const ctx = canvas.getContext('2d');

			// Fill background with white
			ctx.fillStyle = '#FFFFFF';
			ctx.fillRect(0, 0, this.client.config.get('THUMBNAIL.WIDTH'), this.client.config.get('THUMBNAIL.HEIGHT'));

			// Text properties
			ctx.fillStyle = '#000000';
			ctx.font = '14px Arial';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';

			const padding = 5;
			const maxWidth = this.client.config.get('THUMBNAIL.WIDTH') - 2 * padding;
			const words = text.split('\n');
			const lineHeight = 16;
			let yPosition = padding;

			for (let word of words) {
				while (ctx.measureText(word).width > maxWidth) {
					word = word.slice(0, -1);
				}

				yPosition += lineHeight;
				ctx.fillText(word, padding, yPosition);
			}

			// Convert canvas to buffer
			const textImageBuffer = canvas.toBuffer('image/png');

			// Composite the text image over the white background using sharp
			const buffer = await sharp({
				create: {
					width: this.client.config.get('THUMBNAIL.WIDTH'),
					height: this.client.config.get('THUMBNAIL.HEIGHT'),
					channels: 3,
					background: { r: 255, g: 255, b: 255 },
				},
			})
				.jpeg()
				.composite([{ input: textImageBuffer, top: 0, left: 0 }])
				.toBuffer();

			await fileProvider.writeFile(`${file.userId}/thumbnails/${file.id}.${this.fileExtension}`, buffer);
		} catch (err) {
			this.client.logger.error(`Error creating text thumbnail: ${err}`);
		}
	}
}
