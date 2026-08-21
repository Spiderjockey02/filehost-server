import { CUSTOM_MIME_TYPES } from '@/utils/CONSTANTS';
import type { ExtractedMetadata } from '@/types';
import { basename, extname } from 'node:path';
import mime, { lookup } from 'mime-types';
import { execFile } from 'child_process';
import { open } from 'node:fs/promises';
import type { File } from 'formidable';
import { loadEsm } from 'load-esm';
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
	async extract(file: File, extra?: { originalCreated?: Date }): Promise<ExtractedMetadata | null> {
		let base: ExtractedMetadata | null = null;

		// Fetch metadata from file
		if (file.mimetype?.startsWith('image/')) {
			base = await this.extractFromImage(file.filepath);
		} else if (file.mimetype?.startsWith('video/')) {
			base = await this.extractFromVideo(file.filepath);
		} else {
			return null;
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
				duration = stream.duration ? Number(parseFloat(stream.duration).toFixed(2)) : undefined;
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

	/**
	  * Detects the MIME type of a file.
	  * @param {File} file - The uploaded file.
	  * @returns {string} A promise resolving to the detected MIME type string.
	*/
	async detectMimeType(file: File): Promise<string> {
		const { fileTypeFromFile } = await loadEsm<typeof import('file-type')>('file-type');

		// First try proper binary signature detection.
		const detectedType = await fileTypeFromFile(file.filepath);
		if (detectedType) return detectedType.mime;

		// Try the file extenstion next (THIS SHOULD BE ORIGINAL NAME)
		const extensionType = this.lookupMimeTypeFromName(basename(file.originalFilename ?? ''));

		// As detectedType was undefined, it might be a text file
		const buffer = await this.readFileSample(file.filepath);
		if (!this.isTextLikeContent(buffer)) return extensionType || 'application/octet-stream';

		// See if it's structured text like JSON, HTMl or XML
		const structuredType = this.sniffStructuredTextType(buffer);
		return structuredType || extensionType || 'text/plain';
	}

	/**
	  * Reads the first 8192 bytes of a file for content sniffing.
	  * @param {string} filePath - Path to the file to sample.
	  * @returns {Buffer} A buffer containing up to 8192 bytes from the start of the file.
	*/
	private async readFileSample(filePath: string): Promise<Buffer> {
		const handle = await open(filePath, 'r');
		try {
			const buffer = Buffer.alloc(8192);
			const { bytesRead } = await handle.read(buffer, 0, 8192, 0);
			return buffer.subarray(0, bytesRead);
		} finally {
			await handle.close();
		}
	}

	/**
	  * Determines whether a sample buffer looks like text rather than binary
	  * data, using a combination of BOM detection, shebang detection, and a
	  * byte-level heuristic for the remaining cases.
	  *
	  * @param {Buffer} buffer - A sample of the file's content (typically the first 8192 bytes).
	  * @returns {boolean} If the buffer appears to contain text.
	*/
	private isTextLikeContent(buffer: Buffer): boolean {
		if (buffer.length === 0) return true;

		// UTF-8 BOM
		if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) return true;

		// UTF-16 LE / BE BOM
		if (buffer.length >= 2 && ((buffer[0] === 0xff && buffer[1] === 0xfe) || (buffer[0] === 0xfe && buffer[1] === 0xff))) return true;

		// UTF-32 LE / BE BOM
		if (buffer.length >= 4 && ((buffer[0] === 0xff && buffer[1] === 0xfe && buffer[2] === 0x00 &&	buffer[3] === 0x00)
			|| (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0xfe && buffer[3] === 0xff))) {
			return true;
		}

		// A shebang is a very strong indication of a text/script file.
		if (buffer[0] === 0x23 && buffer[1] === 0x21) return true;

		return this.hasMostlyTextBytes(buffer);
	}

	/**
	  * Heuristically determines whether a buffer is mostly text by counting "suspicious" bytes.
	  * @param {Buffer} buffer - The buffer to inspect.
	  * @returns {boolean} If suspicious bytes make up less than 1% of the buffer.
	*/
	private hasMostlyTextBytes(buffer: Buffer): boolean {
		let suspiciousBytes = 0;
		for (const byte of buffer) {
			// NUL is a particularly strong indication of binary data.
			if (byte === 0x00) {
				suspiciousBytes++;
				continue;
			}
			// Allow normal ASCII whitespace.
			if (byte === 0x09 || byte === 0x0a || byte === 0x0d) continue;

			// Other ASCII control characters are suspicious.
			if (byte < 0x20) suspiciousBytes++;

		}
		return suspiciousBytes / buffer.length < 0.01;
	}

	/**
	  * Attempts to identify a more specific structured text MIME type (JSON, XML, HTML) from a sample buffer.
	  * @param {Buffer} buffer - The text-like buffer.
	  * @returns {string | null} The detected structured MIME type, or `null` if no structured format was recognised.
	*/
	private sniffStructuredTextType(buffer: Buffer): string | null {
		const text = buffer.toString('utf8').trim();
		if (text.length === 0) return null;
		if (this.looksLikeHtml(text)) return 'text/html';
		if (this.looksLikeXml(text)) return 'application/xml';
		if (this.looksLikeJson(text)) return 'application/json';
		return null;
	}

	/**
	  * Checks whether a text sample looks like an HTML document.
	  * @param {string} text - The decoded, trimmed text sample to check.
	  * @returns {boolean} If the sample appears to be HTML.
	*/
	private looksLikeHtml(text: string): boolean {
		const head = text.slice(0, 512).toLowerCase();
		return (head.startsWith('<!doctype html') || /<html[\s>]/.test(head) || /<head[\s>]/.test(head) || /<body[\s>]/.test(head));
	}

	/**
 	  * Checks whether a text sample looks like an XML document.
	  * @param {string} text - The decoded, trimmed text sample to check.
	  * @returns {boolean} If the sample appears to be XML.
	*/
	private looksLikeXml(text: string): boolean {
		if (text.startsWith('<?xml')) return true;
		return /^<[a-zA-Z][\w:-]*(\s[^>]*)?>/.test(text);
	}

	/**
	  * Checks whether a text sample looks like a JSON document.
	  * @param {string} text - The decoded, trimmed text sample to check.
	  * @returns {boolean} If the sample was successfully parsed as JSON.
	*/
	private looksLikeJson(text: string): boolean {
		const firstChar = text[0];
		const lastChar = text[text.length - 1];

		const bracketsMatch = (firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']');
		if (!bracketsMatch) return false;

		try {
			JSON.parse(text);
			return true;
		} catch {
			// Fall through — truncation or malformed JSON, can't confirm.
			return false;
		}
	}

	/**
	  * Determines the MIME type of a file based on its filename or extension.
	  * @param {string} fileName - The name or path of the file to determine the MIME type for.
	  * @returns {string | null} The detected MIME type, or `false` if no MIME type can be determined.
	*/
	private lookupMimeTypeFromName(fileName: string): string | false {
		const extension = extname(fileName).slice(1).toLowerCase();
		if (extension && extension in CUSTOM_MIME_TYPES) return CUSTOM_MIME_TYPES[extension]!;

		return lookup(fileName);
	}

	/**
	  * Returns all supported MIME types.
	  *
	  * Combines MIME types from the Mime-DB & custom MIME mappings.
	  *
	  * @returns {string[]} An array containing all supported MIME types.
	*/
	getMimeTypes(): string[] {
		return [...Object.keys(mime.extensions), ...Object.values(CUSTOM_MIME_TYPES)];
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