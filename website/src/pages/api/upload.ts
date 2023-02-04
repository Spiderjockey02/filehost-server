import type { NextApiRequest, NextApiResponse } from 'next';
import { parseForm, FormidableError } from '../../utils/parse-form';
import { getServerSession } from 'next-auth/next';
import { AuthOptions } from '../api/auth/[...nextauth]';
import { findUser } from '../../db/User';
type Response = {
	data: {
		url: string | string[];
	} | null;
	error: string | null;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
	if (req.method !== 'POST') {
		return	res
			.setHeader('Allow', 'POST')
			.status(405)
			.json({
				data: null,
				error: 'Method Not Allowed',
			});
	}
	// Just after the "Method Not Allowed" code
	try {
		const session = await getServerSession(req, res, AuthOptions);
		if (session) {
			const user = await findUser({ email: session.user?.email as string });
			if (user) {
				const { files } = await parseForm(req, user);

				const file = files.media;
				console.log('fileasd', file);
				const url = Array.isArray(file) ? file.map((f) => f.filepath) : file.filepath;

				return res.status(200).json({
					data: {
						url,
					},
					error: null,
				});
			}
		}

		// Error if invalid session/user
		res.status(401).json({ data:null, error: 'Not allowed to upload' });
	} catch (e: any) {
		if (e instanceof FormidableError) {
			res.status(e.httpCode || 400).json({ data: null, error: e.message });
		} else {
			console.error(e);
			res.status(500).json({ data: null, error: 'Internal Server Error' });
		}
	}
};

export const config = {
	api: {
		bodyParser: false,
	},
};

export default handler;
