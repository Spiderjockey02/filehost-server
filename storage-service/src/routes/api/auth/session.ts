import { Router } from 'express';
import { getSession } from '../../../middleware';
import { fetchUserbyParam } from '../../../db/User';
const router = Router();

export default function() {
	router.post('/', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		const user = await fetchUserbyParam({ id: session.user.id });
		res.json({ user });
	});

	return router;
}
