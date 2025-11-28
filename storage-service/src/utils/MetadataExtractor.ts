import type { ExtractedMetadata } from '@/types';
import { execFile } from 'child_process';
import type { File } from 'formidable';
import { promisify } from 'util';
import sharp from 'sharp';
import exifr from 'exifr';
const execFileAsync = promisify(execFile);

export default class MetadataExtractor {
	/**
	  * Extract metadata from the file for parsing
	  * @param file The file to read from
	  * @param extra Extra information from the upload metadata
	  * @returns {ExtractedMetadata} The extracted metadata
	*/
	async extract(file: File, extra?: { originalCreated?: Date }): Promise<ExtractedMetadata> {
		let base: ExtractedMetadata | null = null;

		// Fetch metadata from file
		if (file.mimetype?.startsWith('image/')) {
			base = await this.extractFromImage(file.filepath);
		} else if (file.mimetype?.startsWith('video/')) {
			base = await this.extractFromVideo(file.filepath);
		} else {
			throw new Error('Unsupported file type');
		}

		// Calculate the best time the original file was created
		const filenameDate = this.extractDateFromFilename(`${file.originalFilename}`);
		// Exif > File name > original > now
		const originalCreatedAt = base.originalCreatedAt ?? filenameDate ?? extra?.originalCreated ?? new Date();

		return {
			...base,
			originalCreatedAt,
		};
	}

	/**
	  * Extract metadata from an image
	  * @param file The file to read from
	  * @returns {ExtractedMetadata} The extracted metadata
	*/
	async extractFromImage(filePath: string): Promise<ExtractedMetadata> {
		let width: number | undefined;
		let height: number | undefined;

		try {
			const info = await sharp(filePath).metadata();
			width = info.width;
			height = info.height;
		} catch {}

		let exifDate: Date | null = null;
		let cameraModel = null;
		let gpsLat;
		let gpsLng;
		let exif;

		try {
			exif = await exifr.parse(filePath, { translateValues: true });
			console.log(exif);

			if (exif) {
				exifDate = exif.DateTimeOriginal ? new Date(exif.DateTimeOriginal)
					: exif.CreateDate
						? new Date(exif.CreateDate) : null;

				cameraModel = exif.Model ?? null;
				gpsLat = exif.latitude ? Number(parseFloat(exif.latitude).toFixed(2)) : undefined;
				gpsLng = exif.longitude ? Number(parseFloat(exif.longitude).toFixed(2)) : undefined;
			}
		} catch {}

		return {
			width,
			height,
			cameraModel,
			gpsLatitude: gpsLat,
			gpsLongitude: gpsLng,
			exif,
			// @ts-expect-error Won't be undefined when passing to database
			originalCreatedAt: exifDate || undefined,
		};
	}

	/**
	  * Extract metadata from a video
	  * @param file The file to read from
	  * @returns {ExtractedMetadata} The extracted metadata
	*/
	async extractFromVideo(filePath: string): Promise<ExtractedMetadata> {
		let width = null;
		let height = null;
		let duration: number | undefined;
		let codec = null;
		let frameRate: number | undefined;
		let exifDate: Date | null = null;

		try {
			const { stdout } = await execFileAsync('ffprobe', [
				'-v', 'error',
				'-select_streams', 'v:0',
				'-show_entries',
				'stream=width,height,codec_name,duration,avg_frame_rate,r_frame_rate,tags',
				'-of', 'json',
				filePath,
			]);

			const stream = JSON.parse(stdout).streams?.[0];

			if (stream) {
				width = stream.width ?? null;
				height = stream.height ?? null;
				duration = stream.duration ? parseFloat(stream.duration) : undefined;
				codec = stream.codec_name ?? null;

				if (stream.avg_frame_rate && stream.avg_frame_rate !== '0/0') {
					frameRate = this.parseFraction(stream.avg_frame_rate);
				} else if (stream.r_frame_rate && stream.r_frame_rate !== '0/0') {
					frameRate = this.parseFraction(stream.r_frame_rate);
				}

				// Video taken date
				if (stream.tags?.creation_time) exifDate = new Date(stream.tags.creation_time);
			}
		} catch {}

		return {
			width,
			height,
			duration,
			codec,
			frameRate: frameRate ? Math.round(frameRate) : undefined,
			// @ts-expect-error Won't be undefined when passing to database
			originalCreatedAt: exifDate || undefined,
		};
	}

	/**
	  * Extract the data from file name
	  * @param fileName The file's name
	  * @returns {Date | null} The extracted data, if present
	*/
	extractDateFromFilename(fileName: string): Date | null {
		// robust patterns with named capture groups; we use exec() to search anywhere
		const patterns: RegExp[] = [
			// YYYY-MM-DD_HH-MM-SS  e.g. 2025-10-26_12-25-27
			/(?<y>\d{4})-(?<mo>\d{2})-(?<d>\d{2})[_](?<h>\d{2})-(?<mi>\d{2})-(?<s>\d{2})/,

			// YYYY-MM-DD HH.MM.SS or YYYY.MM.DD HH:MM:SS  e.g. 2025-10-26 12.25.27 or 2025.10.26 12:25:27
			/(?<y>\d{4})[-_.](?<mo>\d{2})[-_.](?<d>\d{2})[ _.-]+(?<h>\d{2})[.:](?<mi>\d{2})[.:](?<s>\d{2})/,

			// Compact YYYYMMDD_HHMMSS or YYYYMMDD-HHMMSS e.g. 20251026_122527
			/(?<y>\d{4})(?<mo>\d{2})(?<d>\d{2})[_-](?<h>\d{2})(?<mi>\d{2})(?<s>\d{2})/,

			// Prefix like IMG_YYYYMMDD_HHMMSS or VID-YYYYMMDD-HHMMSS
			/[A-Za-z]+[_-](?<y>\d{4})(?<mo>\d{2})(?<d>\d{2})[_-](?<h>\d{2})(?<mi>\d{2})(?<s>\d{2})/,

			// Date only variants YYYY-MM-DD or YYYYMMDD (no time)
			/(?<y>\d{4})[-_.]?(?<mo>\d{2})[-_.]?(?<d>\d{2})/,
		];

		for (const re of patterns) {
			const m = re.exec(fileName);
			if (!m || !m.groups) continue;
			const { y, mo, d, h, mi, s } = m.groups;

			const parts = {
				y: Number(y),
				mo: Number(mo),
				d: Number(d),
				h: h ? Number(h) : 0,
				mi: mi ? Number(mi) : 0,
				s: s ? Number(s) : 0,
			};

			// Build the date
			const date = new Date(parts.y, parts.mo - 1, parts.d, parts.h, parts.mi, parts.s);

			// Validate ranges
			if (date.getFullYear() !== parts.y || date.getMonth() !== parts.mo - 1
				|| date.getDate() !== parts.d || date.getHours() !== parts.h || date.getMinutes() !== parts.mi || date.getSeconds() !== parts.s) return null;

			return date;
		}

		return null;
	}

	private parseFraction(fr: string): number | undefined {
		try {
			const [num, den] = fr.split('/').map(Number);
			if (!num || !den) return undefined;
			return num / den;
		} catch {
			return undefined;
		}
	}
}