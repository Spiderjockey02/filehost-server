import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { updateUser, fetchUserbyParam } from '../accessors/User';
import { avatarForm, getSession } from '../middleware';
import { Logger, Error } from '../utils';
import emailValidate from 'deep-email-validator';

// Endpoint: POST /api/session/change-password
export const postChangePassword = () => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

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

			const salt = await bcrypt.genSalt(10);
			const hashedPwd = await bcrypt.hash(password, salt);
			await updateUser({ id: session.user.id, password: hashedPwd });
			res.json({ success: 'Successfully updated password.' });
		} catch (err) {
			Logger.error(err);
			res.json({ type: 'misc', error: 'Failed to update password.' });
		}
	};
};

// Endpoint: POST /api/session/change-avatar
export const postChangeAvatar = () => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

			// Parse and save file(s)
			await avatarForm(req, session.user.id);
			return res
				.json({ success: 'File successfully uploaded.' });
		} catch (err) {
			console.log('erro2', err);
			res.json({ error: 'Failed to upload file' });
		}
	};
};

// Endpoint: POST /api/session/change-email
export const postChangeEmail = () => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');
			const { email } = req.body;

			const isEmailValid = await emailValidate(email);
			if (!isEmailValid.valid) return res.json({ error: 'Invalid email.' });

			// Update user's email
			await updateUser({ id: session.user.id, email });
			res.json({ success: 'Successfully updated email.' });
		} catch (err) {
			console.log(err);
			res.json({ error: 'Failed to update email.' });
		}
	};
};