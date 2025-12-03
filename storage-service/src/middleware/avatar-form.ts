import type { User } from '@/types/generated/client';
import { readFile } from 'node:fs/promises';
import type { Request } from 'express';
import Client from '@/helpers/Client';
import formidable from 'formidable';
import { getIP } from '../utils';
import sharp from 'sharp';

export default async (client: Client, req: Request, user: User) => {
	// Get storage and it's provider
	const storage = await client.FileManager.storageManager.fetchAvatarMedium();
	if (storage == null) throw 'Storage not found';
	const fileProvider = await client.FileManager.storageManager.getProvider(storage);

	const form = formidable({
		multiples: false,
		maxFileSize: client.config.get('MAX_AVATAR_SIZE'),
		allowEmptyFiles: false,
		maxFiles: 1,
		filename: () => `${user.id}.webp`,
		filter: function({ mimetype }) {
			// @ts-expect-error Broken types for error event
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
		const buffer = await readFile(file[0].filepath);
		await fileProvider.writeFile(`${user.id}.webp`, buffer);

		// User could have an avatar from an oauth2 provider, so we need to clear that too
		await client.userManager.update({
			id: user.id,
			image: null,
		});

		client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
			await client.AuditLogManager.create({
				resourceType: 'USER',
				eventName: 'USER_AVATAR_CHANGE',
				resourceId: user.id,
				ip: getIP(req),
				userAgent: req.headers['user-agent'],
				success: true,
				message: 'Successfully updated avatar.',
			});
		});

		return { fields, files };
	} catch (err) {
		client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
			await client.AuditLogManager.create({
				resourceType: 'USER',
				eventName: 'USER_AVATAR_CHANGE',
				resourceId: user.id,
				ip: getIP(req),
				userAgent: req.headers['user-agent'],
				success: false,
				message: `Failed to update avatar due to error: ${err}.`,
			});
		});

		await fileProvider.deleteFile(file[0].filepath);
		throw err;
	}
};