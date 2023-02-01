import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { findUser } from '../../../db/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { password, email } = req.body;
	try {
		const user = await findUser({ email });
		if (!user) return res.json({ error: 'Missing user' });
		const isMatch = await bcrypt.compare(password, user.password as string);
		if (isMatch) {
			res.json({ success: 'User successfully logged in', user });
		} else {
			res.json({ error: 'Incorrect password' });
		}
	} catch (err) {
		console.log(err);
		res.json({ error: 'An error occured when fetching server' });
	}
}
