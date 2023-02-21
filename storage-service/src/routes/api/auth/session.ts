import { Router } from 'express';
import { findUser } from '../../../db/User';
const router = Router();

const usersRecentlyUpdatedSession = <Array<string>>[];

export default function() {
	router.post('/add', async (req, res) => {
		const user = await findUser({ id: req.body.data.id });
		if (user) {
			res.json({ success: 'Id is correct' });
			usersRecentlyUpdatedSession.push(user.id);

			// Remove after user ID 10 seconds
			setTimeout(() => {
				usersRecentlyUpdatedSession.splice(usersRecentlyUpdatedSession.indexOf(user.id), 1);
			}, 10 * 1000);
		} else {
			res.status(403).json({ error: 'Invalid ID' });
		}
	});

	router.get('/check', (req, res) => {
		const userId = req.body.id;
		if (usersRecentlyUpdatedSession.includes(userId)) {
			res.json({ success: 'Id is correct' });
		} else {
			res.status(403).json({ error: 'Invalid ID' });
		}

	});
	return router;
}
