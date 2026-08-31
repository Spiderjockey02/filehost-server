import FileManager from '../helpers/SystemManagers/FileOperationManager';
import type { File, StorageMedium } from '@/types/generated/client';
import { pipeline as _pipeline, Readable } from 'node:stream';
import { handleFFMPEGEncoding } from '../media/Streams';
import { createCanvas, registerFont } from 'canvas';
import { exec, spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import type Client from '../helpers/Client';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { promisify } from 'util';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
const pipeline = promisify(_pipeline);
registerFont(`${process.cwd()}/assets/DejaVuSansMono.ttf`, { family: 'DejaVu Sans Mono', weight: '400', style: 'normal' });

export default class ThumbnailCreator {
	fileExtension: string;
	SystemManager: FileManager;
	client: Client;

	// Queue handling
	queue = new Map<string, File>();
	processing = new Set<string>();

	constructor(fileSystemManager: FileManager) {
		this.fileExtension = 'webp';
		this.SystemManager = fileSystemManager;
		this.client = fileSystemManager.client;
	}

	/**
	  * Queue a thumbnail for generation.
	  * @param {File} file The file object
	  * If the thumbnail is already queued or being generated, the request is ignored.
	*/
	createThumbnail(file: File): void {
		if (this.queue.has(file.id) || this.processing.has(file.id)) return;

		this.queue.set(file.id, file);
		this.processQueue();
	}

	/**
	  * Process queued thumbnails while workers are available.
	*/
	private processQueue(): void {
		const concurrant = this.client.config.get('THUMBNAIL.CONCURRENT');
		while (this.processing.size < concurrant && this.queue.size > 0) {
			const next = this.queue.entries().next().value;
			if (next === undefined) return;

			const [fileId, file] = next;
			this.queue.delete(fileId);
			this.processing.add(fileId);
			this.processThumbnail(file);
		}
	}

	/**
	  * Create a thumbnail for the given file.
	  * @param {File} file The file object
	*/
	async processThumbnail(file: File): Promise<void> {
		this.client.logger.debug(`Creating thumbnail for file ${file.id} with mimetype ${file.mimetype}`);

		// Check for generic file types
		try {
			let created = false;
			switch (file.mimetype!.split('/')[0]) {
				case 'image':
					await this.createFromImage(file);
					created = true;
					break;
				case 'video':
					await this.createFromVideo(file);
					created = true;
					break;
				case 'text':
					await this.generateTextThumbnail(file);
					created = true;
					break;
			}

			if (!created) {
				switch (file.mimetype) {
					case 'application/json':
					case 'application/xml':
					case 'application/javascript':
					case 'application/x-httpd-php':
					case 'application/x-yaml':
					case 'application/rtf':
						created = true;
						await this.generateTextThumbnail(file);
						break;
					case 'application/pdf':
						created = true;
						await this.createFromPDF(file);
						break;
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
						created = true;
						await this.createFromDoc(file);
						break;
				}
			}

			// Send via socket to tell client to refetch as image is finished creating
			if (!created) return this.client.logger.debug(`No thumbnail generator available for file ${file.id} (${file.mimetype})`);
			this.client.socket.to(file.userId).emit(`thumbnailReady:${file.id}`, { fileId: file.id });
		} catch (err) {
			this.client.logger.error(`Failed to create thumbnail for file ${file.id}: ${err}`);
		} finally {
			this.processing.delete(file.id);
			this.processQueue();
		}
	}

	/**
	  * Create a thumbnail from a given image
	  * @param {File} file The file object
	*/
	private async createFromImage(file: File) {
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
	}

	/**
	  * Create a thumbnail from a given video
	  * @param {File} file The file object
	*/
	private async createFromVideo(file: File) {
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
	}

	/**
	  * Create a thumbnail from a given PDF
	  * @param {File} file The file object
	*/
	private async createFromPDF(file: File) {
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
	}

	/**
	  * Create a thumbnail from a given document-based file
	  * @param {File} file The file object
	*/
	private async createFromDoc(file: File) {
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
	}

	/**
	  * Create a thumbnail from a given text file
	  * @param {File} file The file object
	*/
	private async generateTextThumbnail(file: File) {
		const fileProvider = await this.SystemManager.storageManager.getProviderById(file.storageId);
		const text = await fileProvider.readFile(file, 'utf-8');
		const width = this.client.config.get('THUMBNAIL.WIDTH');
		const height = this.client.config.get('THUMBNAIL.HEIGHT');

		// Render at 4x resolution and downsample afterwards.
		const scale = 4;
		const renderWidth = Math.ceil(width * scale);
		const renderHeight = Math.ceil(height * scale);

		const canvas = createCanvas(renderWidth, renderHeight);
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = '#FFFFFF';
		ctx.fillRect(0, 0, renderWidth, renderHeight);

		const fontSize = 12;
		const lineHeight = 16;
		const padding = 5;

		ctx.fillStyle = '#000000';
		ctx.font = `${fontSize * scale}px "DejaVu Sans Mono"`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';

		const scaledPadding = padding * scale;
		const scaledLineHeight = lineHeight * scale;
		const maxWidth = renderWidth - scaledPadding * 2;
		let yPosition = scaledPadding;

		for (let line of text.split('\n')) {
			while (line.length > 0 && ctx.measureText(line).width > maxWidth) {
				line = line.slice(0, -1);
			}

			ctx.fillText(line, scaledPadding, yPosition);
			yPosition += scaledLineHeight;
			if (yPosition + scaledLineHeight > renderHeight) break;
		}

		const textImageBuffer = canvas.toBuffer('image/png');
		const buffer = await sharp(textImageBuffer)
			.resize(width, height, { kernel: sharp.kernel.lanczos3 })
			.sharpen({ sigma: 0.5 })
			.png({ compressionLevel: 9 })
			.toBuffer();

		await fileProvider.writeFile(`${file.userId}/thumbnails/${file.id}.${this.fileExtension}`, buffer);
	}
}
