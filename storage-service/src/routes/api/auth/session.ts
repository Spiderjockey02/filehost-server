import { Router } from 'express';
import { fetchUserbyParam } from '../../../db/User';
import { getSession } from '../../../middleware';
const router = Router();

export default function() {
	router.get('/:userId', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const userId = req.params.userId;

		const user = await fetchUserbyParam({ id: userId });
		res.json({ user });
	});

	return router;
}
