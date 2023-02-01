import type { NextApiRequest } from 'next';
import { join } from 'path';
import formidable from 'formidable';
import { mkdir, stat } from 'fs/promises';

export const FormidableError = formidable.errors.FormidableError;

export const parseForm = async (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
	return await new Promise(async (resolve, reject) => {
		const uploadDir = join(process.cwd(), `/uploads/${new Intl.DateTimeFormat('en-US').format(new Date()).replace('/', '_')}`);

		try {
			await stat(uploadDir);
		} catch (e: any) {
			if (e.code === 'ENOENT') {
				await mkdir(uploadDir, { recursive: true });
			} else {
				console.error(e);
				return reject(e);
			}
		}

		const form = formidable({
			maxFiles: 10,
			// 10 MB
			maxFileSize: 1024 * 1024 * 10,
			uploadDir,
			filename: (_name, _ext, part) => {
				return `${part.originalFilename}`;
			},
			filter: (part) => part.name === 'media' && (part.mimetype?.includes('image') || false),
		});

		form.parse(req, function(err, fields, files) {
			if (err) reject(err);
			else resolve({ fields, files });
		});
	});
};
