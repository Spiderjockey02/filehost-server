import formidable from 'formidable';
import type { Request } from 'express';
import { PATHS } from '../utils';

const avatarForm = async (req: Request, userId: string): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
	// eslint-disable-next-line no-async-promise-executor
	return await new Promise(async (resolve, reject) => {
		const form = formidable({
			multiples: false,
			maxFileSize: 1024 * 1024 * 1024 * 10,
			uploadDir: PATHS.AVATAR,
			filename: () => {
				return `${userId}.webp`;
			},
			filter: function({ mimetype }) {
				// keep only images
				return mimetype?.includes('image') ?? false;
			},
		});

		form.parse(req, async function(err, fields, files) {
			if (err) reject(err);
			else resolve({ fields, files });
		});
	});
};

export default avatarForm;
