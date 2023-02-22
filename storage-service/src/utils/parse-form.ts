import { join } from 'path';
import formidable from 'formidable';
import { stat, mkdir } from 'fs/promises';
import type { Request } from 'express';
// import { getUserById } from '../db/User';
import { PATHS } from './CONSTANTS';
export const FormidableError = formidable.errors.FormidableError;


export const parseForm = async (req: Request, userId: string): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
	// eslint-disable-next-line no-async-promise-executor
	return await new Promise(async (resolve, reject) => {

		const uploadDir = join(PATHS.CONTENT, userId, (req.headers['referer'] as string).split('files')[1]);

		try {
			await stat(uploadDir);
		} catch (e: any) {
			console.log(e);
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
		});

		form.parse(req, function(err, fields, files) {
			if (err) reject(err);
			else resolve({ fields, files });
		});
	});
};
