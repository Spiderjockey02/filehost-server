import { CONSTANTS, PATHS } from '../utils';
import type { Request } from 'express';
import Client from '../helpers/Client';
import formidable from 'formidable';
import path from 'node:path';
import sharp from 'sharp';

export default async (client: Client, req: Request, userId: string) => {
	const form = formidable({
		multiples: false,
		maxFileSize: CONSTANTS.MAX_AVATAR_SIZE,
		allowEmptyFiles: false,
		maxFiles: 1,
		filename: () => `${userId}.webp`,
		filter: function({ mimetype }) {
			// @ts-ignore Broken types for error event
			if (!mimetype?.includes('image')) form.emit('error', 'The uploaded avatar must be an image file (e.g., JPEG, PNG, GIF).');
			return true;
		},
	});

	// Parse the form data
	const [fields, files] = await form.parse(req);
	const file = files[Object.keys(files)[0]];
	if (file == undefined) throw 'No file was uploaded.';

	try {
		// Now do some checks on the file
		const metadata = await sharp(`${file[0].filepath}`, { pages: -1 }).metadata();
		if ((metadata.width ?? 0) > 1024 || (metadata.height ?? 0) > 1024) throw 'Image dimensions must not exceed 1024x1024.';

		// Check if image is animated GIF etc
		if ((metadata.pages ?? 1) > 1) throw 'Animated images are not allowed.';

		// Move to avatar directory, overwriting the old one
		await client.FileManager.renameOnSystem(file[0].filepath, path.join(PATHS.AVATAR, `${userId}.webp`));

		// Return the parsed fields and files
		return { fields, files };
	} catch (error) {
		await client.FileManager.deleteFileOnSystem(file[0].filepath);
		throw error;
	}
};