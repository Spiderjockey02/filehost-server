import imageThumbnail from 'image-thumbnail';
import { spawn } from 'node:child_process';
import { createCanvas } from 'canvas';
import { PDFImage } from 'pdf-image';
import { lookup } from 'mime-types';
import fs from 'node:fs/promises';
import { PATHS } from '../utils';
import sharp from 'sharp';

export default class ThumbnailCreator {
	width: number;
	height: number;

	constructor() {
		this.width = 400;
		this.height = 520;
	}

	async createThumbnail(userId: string, filePath: string) {
		const file = await this.getFileByPath(userId, filePath);
		if (!file) return `${PATHS.THUMBNAIL}/missing-file-icon.png`;

		const folder = filePath.split('/').slice(0, -1).join('/');
		await this.createFolderIfNotExists(`${PATHS.THUMBNAIL}/${userId}/${folder}`);

		const mimeType = lookup(filePath);
		if (!mimeType) return `${PATHS.THUMBNAIL}/missing-file-icon.png`;

		if (mimeType.startsWith('image/')) {
			await this.createFromImage(userId, filePath);
		} else if (mimeType.startsWith('video/')) {
			await this.createFromVideo(userId, filePath);
		} else if (mimeType === 'application/pdf') {
			await this.createFromPDF(userId, filePath);
		} else if (mimeType.startsWith('text/')) {
			await this.generateTextThumbnail(userId, filePath);
		} else {
			return `${PATHS.THUMBNAIL}/missing-file-icon.png`;
		}
	}

	private async getFileByPath(userId: string, filePath: string) {
		try {
			const file = await fs.stat(`${PATHS.CONTENT}/${userId}/${filePath}`);
			return file ? { path: filePath, name: filePath.split('/').pop() || '' } : null;
		} catch {
			return null;
		}
	}

	private async createFolderIfNotExists(folderPath: string) {
		try {
			await fs.mkdir(folderPath, { recursive: true });
		} catch (err: any) {
			if (err.code !== 'EEXIST') throw err;
		}
	}

	private async createFromImage(userId: string, path: string) {
		try {
			// @ts-ignore Broken types
			const thumbnail = await imageThumbnail(`${PATHS.CONTENT}/${userId}/${path}`, {
				responseType: 'buffer',
				width: this.width,
				height: this.height,
				fit: 'cover',
			});
			await fs.writeFile(`${PATHS.THUMBNAIL}/${userId}/${path.replace(/\.[^/.]+$/, '')}.jpg`, thumbnail);
		} catch (err) {
			console.error(`Error creating image thumbnail: ${err}`);
		}
	}

	private async createFromVideo(userId: string, path: string) {
		try {
			const outputFilePath = `${PATHS.THUMBNAIL}/${userId}/${path.replace(/\.[^/.]+$/, '')}.jpg`;
			const child = spawn('ffmpeg', [
				'-i', `${PATHS.CONTENT}/${userId}/${path}`,
				'-ss', '00:00:00.750',
				'-vframes', '1',
				outputFilePath,
			]);

			await new Promise((resolve, reject) => {
				child.on('close', resolve);
				child.on('error', reject);
			});
		} catch (err) {
			console.error(`Error creating video thumbnail: ${err}`);
		}
	}

	private async createFromPDF(userId: string, path: string) {
		try {
			const pdfImage = new PDFImage(`${PATHS.CONTENT}/${userId}${path}`);
			const imagePath = await pdfImage.convertPage(0);
			await fs.rename(imagePath, `${PATHS.THUMBNAIL}/${userId}/${path.replace(/\.[^/.]+$/, '')}.jpg`);
		} catch (err) {
			console.error(`Error creating PDF thumbnail: ${err}`);
		}
	}

	private async generateTextThumbnail(userId: string, path: string) {
		try {
			const text = await fs.readFile(`${PATHS.CONTENT}/${userId}/${path}`, 'utf8');

			// Canvas setup
			const canvas = createCanvas(this.width, this.height);
			const ctx = canvas.getContext('2d');

			// Fill background with white
			ctx.fillStyle = '#FFFFFF';
			ctx.fillRect(0, 0, this.width, this.height);

			// Text properties
			ctx.fillStyle = '#000000';
			ctx.font = '24px Arial';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';

			const padding = 10;
			const maxWidth = this.width - 2 * padding;

			// Split text into multiple lines if it overflows
			const words = text.split('\n');
			let line = '';
			const lineHeight = 28;
			let yPosition = padding;

			words.forEach(word => {
				if (yPosition >= this.height) return;

				const testLine = `${line}${word} `;
				const testWidth = ctx.measureText(testLine).width;

				if (testWidth > maxWidth && line !== '') {
					ctx.fillText(line, padding, yPosition);
					line = `${word} `;
					yPosition += lineHeight;
					console.log(yPosition);
				} else {
					line = testLine;
				}
			});

			// Draw the last line
			ctx.fillText(line, padding, yPosition);

			// Convert canvas to buffer
			const textImageBuffer = canvas.toBuffer('image/png');

			// Composite the text image over the white background using sharp
			await sharp({
				create: {
					width: this.width,
					height: this.height,
					channels: 3,
					background: { r: 255, g: 255, b: 255 },
				},
			})
				.composite([
					{
						input: textImageBuffer,
						top: 0,
						left: 0,
					},
				])
				.toFile(`${PATHS.THUMBNAIL}/${userId}/${path.replace(/\.[^/.]+$/, '')}.jpg`);
		} catch (err) {
			console.error(`Error generating text thumbnail: ${err}`);
		}
	}
}
