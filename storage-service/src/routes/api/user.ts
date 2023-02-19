// For upload, delete, move etc endpoints
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { updateUserPassword } from '../../db/User';
const router = Router();

export default function() {
	router.post('/update', (req, res) => {
		console.dir(req.body, { depth: null });
		res.json({ success: 'Success' });
	});

	router.post('/:userId/change-password', async (req, res) => {
		const userId = req.params.userId;
		const { password, password2 } = req.body;

		// Check for missing fields
		if (!password) return res.json({ error: 'Missing field' });
		if (!password2) return res.json({ error: 'Missing field' });

		// check if passwords match
		if (password !== password2) return res.json({ error: 'Passwords dont match!' });

		// check if password is more than 8 characters
		if (password?.length <= 8) return res.json({ error: 'Password must be atleast 8 characters long!' });

		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPwd = await bcrypt.hash(password, salt);
			await updateUserPassword({ id: userId, password: hashedPwd });
			res.json({ success: 'Successfully updated password' });
		} catch (err) {
			console.log(err);
			res.json({ error: 'Failed to update password' });
		}
	});

	router.delete('/:userId', (req, res) => {
		const userId = req.params.userId;
		res.json(userId);
	});

	return router;
}
