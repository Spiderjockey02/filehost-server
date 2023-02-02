import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { AuthOptions } from '../../api/auth/[...nextauth]';
import { findUser } from '../../../db/prisma';
import fs from 'fs';
import path from 'path';

const handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
	const refererURL = (req.headers['referer'] as string).split('files')[1];

	const session = await getServerSession(req, res, AuthOptions);
	if (session) {
		const user = await findUser({ email: session.user?.email as string });
		const readStream = fs.readFileSync(path.join(`${process.cwd()}/uploads/${user?.id}`, refererURL));
		return res.status(200).end(readStream);

	}
};

export default handler;
