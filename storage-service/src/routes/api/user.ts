// For upload, delete, move etc endpoints
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { updateUser, fetchUserbyParam } from '../../db/User';
import emailValidate from 'deep-email-validator';
import { avatarForm, getSession } from '../../middleware';
const router = Router();

export default function() {
	router.post('/change-password', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		const { currentPassword, password, password2 } = req.body;

		// Check for missing fields
		if (!password) return res.json({ type: 'pwd1', error: 'Missing field' });
		if (!password2) return res.json({ type: 'pwd2', error: 'Missing field' });

		// check if passwords match
		if (password !== password2) return res.json({ type: 'pwd1', error: 'The passwords do not match' });

		// check if password is more than 8 characters
		if (password?.length <= 8) return res.json({ type: 'pwd1', error: 'Your password must be more than 8 characters' });

		const user = await fetchUserbyParam({ id: session.user.id });
		if (!user) return res.json({ type: 'misc', error: 'Invalid request' });

		const isMatch = await bcrypt.compare(currentPassword, user.password as string);
		if (!isMatch) return res.json({ type: 'current', error: 'Password is Incorrect' });

		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPwd = await bcrypt.hash(password, salt);
			await updateUser({ id: session.user.id, password: hashedPwd });
			res.json({ success: 'Successfully updated password.' });
		} catch (err) {
			console.log(err);
			res.json({ type: 'misc', error: 'Failed to update password.' });
		}
	});

	router.post('/avatar', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		try {
			// Parse and save file(s)
			const { files } = await avatarForm(req, session.user.id);
			console.log('avatar files: ', files);
			return res
				.setHeader('Content-Type', 'application/json')
				.status(200)
				.json({ success: 'File successfully uploaded.' });
		} catch (err) {
			console.log('erro2', err);
			res
				.setHeader('Content-Type', 'application/json')
				.json({ error: 'Failed to upload file' });
		}
	});


	router.post('/change-email', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const { email } = req.body;

		const isEmailValid = await emailValidate(email);
		if (!isEmailValid.valid) return res.json({ error: 'Invalid email.' });

		try {
			// Update user's email
			await updateUser({ id: session.user.id, email });
			res.json({ success: 'Successfully updated email.' });
		} catch (err) {
			console.log(err);
			res.json({ error: 'Failed to update email.' });
		}
	});

	return router;
}
