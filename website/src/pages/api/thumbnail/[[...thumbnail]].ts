import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import MimeType from 'mime-types'
import {spawn} from 'child_process'
import { getServerSession } from 'next-auth/next';
import { AuthOptions } from '../../api/auth/[...nextauth]';
import {findUser} from '../../../db/prisma';
// Endpoint for showing/creating thumbnails of all files
const handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
	// create path for thumbnail
	const refererURL = (req.headers['referer'] as string).split('files')[1];
	const fileName = (req.query.thumbnail as Array<string>).join('/');

	const session = await getServerSession(req,res,AuthOptions);
	if (session) {
		const user = await findUser({email: session.user?.email as string})
		const fileType = MimeType.lookup(fileName)
		if(fileType == false) return

		switch (fileType.split('/')[0]) {
			case 'image': {
				const pathURL = path.join(`${process.cwd()}/uploads/${user?.id}`, refererURL, fileName);

				const readStream = fs.readFileSync(pathURL);
				return res.status(200).end(readStream);
			}
			case 'video': {
				if (fs.existsSync(`${path.join(`${process.cwd()}/uploads/${user?.id}`, refererURL, fileName)}-temp.jpg`)) {
					const readStream = fs.readFileSync(`${path.join(`${process.cwd()}/uploads/${user?.id}`, refererURL, fileName)}-temp.jpg`);
					return res.status(200).end(readStream);
				} else {
					const child = spawn('ffmpeg',
						['-i',
							`${path.join(`${process.cwd()}/uploads/${user?.id}`, refererURL, fileName)}`, '-ss', '00:00:01.000', '-vframes', '1',
							`${path.join(`${process.cwd()}/uploads/${user?.id}`, refererURL, fileName)}-temp.jpg`
						]);

					await new Promise((resolve, reject) => {
						child.on('close', resolve);
						child.on('error', (err) => {
							console.log(err);
							reject();
						});
					});
					const readStream = fs.readFileSync(`${path.join(`${process.cwd()}/uploads/${user?.id}`, refererURL, fileName)}-temp.jpg`);
					return res.status(200).end(readStream);
				}
			}
			default:
				return
		}
	}
};

export const config = {
	api: {
		bodyParser: false,
	},
};

export default handler;
