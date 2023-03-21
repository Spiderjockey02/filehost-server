import { Router } from 'express';
import bcrypt from 'bcrypt';
import { fetchUserbyParam } from '../../../db/User';
const router = Router();

export default function() {
	router.post('/', async (req, res) => {
		const { password, email } = req.body;

		try {
			const user = await fetchUserbyParam({ email });
			if (!user) return res.status(401).json({ error: 'Missing user' });
			const isMatch = await bcrypt.compare(password, user.password as string);
			if (isMatch) {
				res.json({ success: 'User successfully logged in', user });
			} else {
				res.status(401).json({ error: 'Incorrect password' });
			}
		} catch (err) {
			console.log(err);
			res.status(500).json({ error: 'An error occured when fetching server' });
		}
	});

	return router;
}
