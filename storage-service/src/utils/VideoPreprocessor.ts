import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import Client from '@/helpers/Client';

/**
  * Clean up the videos by moving the metadata to the start of the file and stripping optional metadata.
  * @param {string} filePath - The path to the video file.
  * @param {string} fileType - The type of the video file (e.g., mp4, mkv).
*/
export async function cleanUpVideo(client: Client, filePath: string, fileType: string) {
	try {
		// Construct movflags
		const movFlags = ['faststart'];
		if (client.config.get('KEEP_ORIGINAL_METADATA')) movFlags.push('use_metadata_tags');

		const ffmpeg = spawn('ffmpeg', [
			'-i', `${filePath}`,
			'-map_metadata', client.config.get('KEEP_ORIGINAL_METADATA') ? '0' : '-1',
			'-movflags', movFlags.join('+'),
			'-c', 'copy',
			`${filePath}-2.${fileType}`,
		]);

		// Restructure video
		await new Promise((resolve, reject) => {
			ffmpeg.on('close', resolve);
			ffmpeg.on('error', reject);
		});

		// Now remove and replace the old video with the new video
		await fs.rm(filePath);
		await fs.rename(`${filePath}-2.${fileType}`, filePath);
	} catch (err) {
		client.logger.error(`Error cleaning up video: ${err}`);
	}
}