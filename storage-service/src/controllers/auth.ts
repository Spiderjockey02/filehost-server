import { Request, Response } from 'express';
import { Error, sanitiseObject } from '../utils';
import bcrypt from 'bcrypt';
import { createNotification } from '../accessors/Notification';
import { getSession } from '../middleware';
import emailValidate from 'deep-email-validator';
import { Client } from 'src/helpers';

type ErrorTypes = {
 type: 'username' | 'email' | 'password' | 'age' | 'misc'
 text: string
}

// Endpoint: POST /api/auth/login
export const postLogin = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { password, email } = req.body;

		try {
			const user = await client.userManager.fetchbyParam({ email });
			if (!user) return Error.MissingAccess(res);
			const isMatch = await bcrypt.compare(password, user.password);
			if (isMatch) {
				res.json({ success: 'User successfully logged in', user: sanitiseObject(user) });
			} else {
				Error.MissingAccess(res, 'Password is incorrect');
			}
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch user information.');
		}
	};
};

// Endpoint: POST /api/auth/register
export const postRegister = (client: Client) => {
	return async (req: Request, res: Response) => {
	// Only post request
		let error = {} as ErrorTypes;
		const { username, email, password, password2 } = req.body.data;

		// Check all fields were filled in
		if (!username) error = { type: 'username', text: 'Missing field' };
		if (!email) error = { type: 'email', text: 'Missing field' };
		if (!password) error = { type: 'password', text: 'Missing field' };
		if (!password2) error = { type: 'password', text: 'Missing field' };

		// check if passwords match
		if (password !== password2) error = { type: 'password', text: 'Passwords dont match!' };

		// check if password is more than 6 characters
		if (password.length <= 8) error = { type: 'password', text: 'Password must be atleast 8 characters long!' };

		// Check if email already is being used
		const isEmailAlreadyBeingUsed = await client.userManager.fetchbyParam({ email });
		if (isEmailAlreadyBeingUsed !== null) error = { type: 'email', text: 'Email already being used.' };

		const isEmailValid = await emailValidate(email);
		if (!isEmailValid.valid) error = { type: 'email', text: 'Email is invalid.' };

		// If an error was found notify user
		if (error.type !== null) return res.status(400).json({ error });

		// Encrypt password (Dont save raw password to database)
		let Hashpassword;
		try {
			const salt = await bcrypt.genSalt(10);
			Hashpassword = await bcrypt.hash(password, salt);
		} catch (err) {
			client.logger.error(err);
			return res.json({ error: { type: 'misc', text: 'Failed to encrypt password' } });
		}

		// Save the new user to database + make sure to create folder
		try {
			const user = await client.userManager.create({ email, name: username, password: Hashpassword });
			await createNotification({ userId: user.id, text: 'Please remember to verify your email.' });
			res.json({ success: 'User successfully created' });
		} catch (err) {
			client.logger.error(err);
			return res.json({ error: { type: 'misc', text: 'Failed to saved user to database' } });
		}
	};
};

// Endpoint: GET /api/auth/session/:userId
export const getSessionUserId = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');
			const userId = req.params.userId;

			const user = await client.userManager.fetchbyParam({ id: userId });
			res.json({ user: sanitiseObject(user) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch session information.');
		}
	};
};