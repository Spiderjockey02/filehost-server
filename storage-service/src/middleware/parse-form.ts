import { join } from 'path';
import formidable from 'formidable';
import { mkdir } from 'fs/promises';
import type { Request } from 'express';
import { PATHS, Client } from '../utils';
import config from '../config';
import type { UserWithGroup } from '../types/database/User';

const parseForm = async (client: Client, req: Request, userId: string): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
	// eslint-disable-next-line no-async-promise-executor
	return await new Promise(async (resolve, reject) => {

		const path = (req.headers['referer'] as string).slice(`${config.frontendURL}/files`.length).length > 0 ?
			decodeURI((req.headers['referer'] as string).slice(`${config.frontendURL}/files`.length)) : '/';

		const uploadDir = join(PATHS.CONTENT, userId, path);
		let user: UserWithGroup | null;
		try {
			user = await client.userManager.fetchbyParam({ id: userId });
			if (!user) throw 'Missing user';

			// Make sure they haven't already uploaded max storage
			if (user.totalStorageSize >= Number(user.group?.maxStorageSize ?? 0)) throw 'Max storage reached';
		} catch (e: any) {
			console.log('error', e);
			if (e?.code === 'ENOENT') {
				await mkdir(uploadDir, { recursive: true });
			} else {
				return reject(e);
			}
		}

		const form = formidable({
			allowEmptyFiles: false,
			maxFileSize: config.maximumFileSize,
			uploadDir,
			filename: (_name, _ext, part) => {
				return `${part.originalFilename}`;
			},
		});

		form.parse(req, async function(err, fields, files) {
			// Update user's total storage size
			const size: number = files.media?.reduce((a, b) => a + b.size, 0) ?? 0;
			await client.userManager.update({ id: userId, totalStorageSize: (user?.totalStorageSize ?? 0n) + BigInt(size) });

			if (err) {
				reject(err);
			} else {
				client.treeCache.delete(`${user?.id}_${path ? `/${path}` : ''}`);
				resolve({ fields, files });
			}
		});
	});
};

export default parseForm;
