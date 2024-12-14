import { join } from 'path';
import formidable from 'formidable';
import { mkdir } from 'fs/promises';
import type { Request } from 'express';
import { fetchUserbyParam, updateUser } from '../accessors/User';
import { PATHS } from '../utils/CONSTANTS';
import config from '../config';
import type { User } from '../types';

const parseForm = async (req: Request, userId: string): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
	// eslint-disable-next-line no-async-promise-executor
	return await new Promise(async (resolve, reject) => {

		const path = (req.headers['referer'] as string).slice(`${config.frontendURL}/files`.length).length > 0 ?
			decodeURI((req.headers['referer'] as string).slice(`${config.frontendURL}/files`.length)) : '/';

		const uploadDir = join(PATHS.CONTENT, userId, path);

		let user: User | null;
		try {
			user = await fetchUserbyParam({ id: userId });
			if (!user) throw 'Missing user';

			// Make sure they haven't already uploaded max storage
			if (Number(0) >= Number(user.group?.maxStorageSize ?? 0)) throw 'Max storage reached';
		} catch (e: any) {
			console.log('error', e);
			if (e?.code === 'ENOENT') {
				await mkdir(uploadDir, { recursive: true });
			} else {
				return reject(e);
			}
		}

		const form = formidable({
			maxFiles: 10,
			multiples: true,
			maxFileSize: 1024 * 1024 * 1024 * 10,
			uploadDir,
			filename: (_name, _ext, part) => {
				return `${part.originalFilename}`;
			},
		});

		form.parse(req, async function(err, fields, files) {
			// Update user's total storage size
			const size = (Array.isArray(files)) ? files.reduce((a, b) => a.size + b, 0) : files.size;
			await updateUser({ id: userId, totalStorageSize: `${Number((user?.totalStorageSize ?? 0) + size)}` });

			if (err) reject(err);
			else resolve({ fields, files });
		});
	});
};

export default parseForm;
