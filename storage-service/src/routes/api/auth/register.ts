import { Router } from 'express';
import bcrypt from 'bcrypt';
import { createUser, findUser } from '../../../db/User';
const router = Router();

type ErrorTypes = {
 type: 'username' | 'email' | 'password' | 'age' | 'misc'
 text: string
}


export default function() {
	router.post('/', async (req, res) => {
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
		const isEmailAlreadyBeingUsed = await findUser({ email: email });
		if (isEmailAlreadyBeingUsed !== null) error = { type: 'email', text: 'Email already being used' };

		// If an error was found notify user
		if (error.type !== null) return res.json({ error });

		// Encrypt password (Dont save raw password to database)
		let Hashpassword;
		try {
			const salt = await bcrypt.genSalt(10);
			Hashpassword = await bcrypt.hash(password, salt);
		} catch (err) {
			console.log(err);
			return res.json({ error: { type: 'misc', text: 'Failed to encrypt password' } });
		}

		// Save the new user to database + make sure to create folder
		try {
			await createUser({ email, name: username, password: Hashpassword });
			res.json({ success: 'User successfully created' });
		} catch (err) {
			console.log(err);
			return res.json({ error: { type: 'misc', text: 'Failed to saved user to database' } });
		}
	});

	return router;
}
