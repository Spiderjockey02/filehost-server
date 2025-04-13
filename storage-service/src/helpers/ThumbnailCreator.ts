import imageThumbnail from 'image-thumbnail';
import { spawn } from 'node:child_process';
import type { File } from '@prisma/client';
import { createCanvas } from 'canvas';
import { PDFImage } from 'pdf-image';
import fs from 'node:fs/promises';
import { PATHS } from '../utils';
import sharp from 'sharp';
import FileSystemManager from './FileSystemManager';

export default class ThumbnailCreator {
	width: number;
	height: number;
	FileSystemManager: FileSystemManager

	constructor(FileSystemManager: FileSystemManager) {
		this.width = 400;
		this.height = 520;
		this.FileSystemManager = FileSystemManager;
	}

	/**
	  * Create a thumbnail for the given file.
	  * @param {File} file The file object
	*/
	async createThumbnail(file: File) {
		// Create file's parent folder but in thumbnail dir
		const folder = file.path.split('/').slice(0, -1).join('/');
		await this.FileSystemManager.createFolderOnSystem(`${PATHS.THUMBNAIL}/${file.userId}/${folder}`);

		// Check if mimetype is null (indicates folder)
		if (file.mimetype == null) return `${PATHS.THUMBNAIL}/missing-file-icon.png`;

		// Check for generic file types
		switch (file.mimetype.split('/')[0]) {
			case 'image':
				await this.createFromImage(file);
				break;
			case 'video':
				await this.createFromVideo(file);
				break;
			case 'text':
				await this.generateTextThumbnail(file);
				break;
		}

		// Check for specific file types
		if (file.mimetype === 'application/pdf') {
			await this.createFromPDF(file);
		} else {
			return `${PATHS.THUMBNAIL}/missing-file-icon.png`;
		}
	}

	/**
	  * Create a thumbnail from a given image
	  * @param {File} file The file object
	*/
	private async createFromImage({ userId, path }: File) {
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

	/**
	  * Create a thumbnail from a given video
	  * @param {File} file The file object
	*/
	private async createFromVideo({ userId, path }: File) {
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

	/**
	  * Create a thumbnail from a given video
	  * @param {File} file The file object
	*/
	private async createFromPDF({ userId, path }: File) {
		try {
			const pdfImage = new PDFImage(`${PATHS.CONTENT}/${userId}${path}`);
			const imagePath = await pdfImage.convertPage(0);
			await fs.rename(imagePath, `${PATHS.THUMBNAIL}/${userId}/${path.replace(/\.[^/.]+$/, '')}.jpg`);
		} catch (err) {
			console.error(`Error creating PDF thumbnail: ${err}`);
		}
	}

	/**
	  * Create a thumbnail from a given text file
	  * @param {File} file The file object
	*/
	private async generateTextThumbnail({ userId, path }: File) {
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
