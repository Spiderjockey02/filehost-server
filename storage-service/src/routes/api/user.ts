// For upload, delete, move etc endpoints
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { updateUser, fetchUserbyParam } from '../../db/User';
import emailValidate from 'deep-email-validator';
import formidable from 'formidable';
import { PATHS } from '../../utils/CONSTANTS';
import { getSession } from '../../utils/functions';
import { join } from 'path';
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
			// eslint-disable-next-line no-async-promise-executor
			await new Promise(async (resolve, reject) => {
				const form = formidable({
					uploadDir: join(PATHS.AVATAR),
					filename: (_name, _ext, part) => {
						return `${part.originalFilename}`;
					},
				});

				form.parse(req, (err, fields, files) => {
					if (err) reject(err);
					else resolve({ fields, files });
				});
			});
			res.json({ success: 'Successfully uploaded avatar' });
		} catch (err) {
			console.log(err);
			res.json({ error: 'Faild to upload avatar' });
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
