import { Router } from 'express';
import { fetchUserbyParam } from '../../../db/User';
const router = Router();

const usersRecentlyUpdatedSession = <Array<string>>[];

export default function() {
	router.post('/verify', async (req, res) => {
		console.log(req.body);

		const user = await fetchUserbyParam({ id: req.body.data.id });
		if (user) {
			res.json({ success: 'Id is correct', user });
			usersRecentlyUpdatedSession.push(user.id);

			// Remove after user ID 10 seconds
			setTimeout(() => {
				usersRecentlyUpdatedSession.splice(usersRecentlyUpdatedSession.indexOf(user.id), 1);
			}, 10 * 1000);
		} else {
			res.status(403).json({ error: 'Invalid ID' });
		}
	});

	return router;
}
