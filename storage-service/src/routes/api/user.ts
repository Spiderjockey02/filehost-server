// For upload, delete, move etc endpoints
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { updateUser } from '../../db/User';
import { validateEmail } from '../../utils/functions';
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
			await updateUser({ id: userId, password: hashedPwd });
			res.json({ success: 'Successfully updated password.' });
		} catch (err) {
			console.log(err);
			res.json({ error: 'Failed to update password.' });
		}
	});

	router.post('/:userId/change-email', async (req, res) => {
		const userId = req.params.userId;
		const { email } = req.body;

		const isEmailValid = await validateEmail(email);
		if (!isEmailValid) return res.json({ error: 'Invalid email.' });

		try {
			// Update user's email
			await updateUser({ id: userId, email });
			res.json({ success: 'Successfully updated email.' });
		} catch (err) {
			console.log(err);
			res.json({ error: 'Failed to update email.' });
		}
	});

	router.delete('/:userId', (req, res) => {
		const userId = req.params.userId;
		res.json(userId);
	});

	return router;
}
