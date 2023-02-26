// For upload, delete, move etc endpoints
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { updateUser, fetchUserbyParam } from '../../db/User';
import { validateEmail } from '../../utils/functions';
const router = Router();

export default function() {
	router.post('/update', (req, res) => {
		console.dir(req.body, { depth: null });
		res.json({ success: 'Success' });
	});

	router.post('/:userId/change-password', async (req, res) => {
		const userId = req.params.userId;
		const { currentPassword, password, password2 } = req.body;

		// Check for missing fields
		if (!password) return res.json({ type: 'pwd1', error: 'Missing field' });
		if (!password2) return res.json({ type: 'pwd2', error: 'Missing field' });

		// check if passwords match
		if (password !== password2) return res.json({ type: 'pwd1', error: 'The passwords do not match' });

		// check if password is more than 8 characters
		if (password?.length <= 8) return res.json({ type: 'pwd1', error: 'Your password must be more than 8 characters' });

		const user = await fetchUserbyParam({ id: userId });
		if (!user) return res.json({ type: 'misc', error: 'Invalid request' });

		const isMatch = await bcrypt.compare(currentPassword, user.password as string);
		if (!isMatch) return res.json({ type: 'current', error: 'Password is Incorrect' });

		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPwd = await bcrypt.hash(password, salt);
			await updateUser({ id: userId, password: hashedPwd });
			res.json({ success: 'Successfully updated password.' });
		} catch (err) {
			console.log(err);
			res.json({ type: 'misc', error: 'Failed to update password.' });
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
