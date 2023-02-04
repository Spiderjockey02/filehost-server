import bcrypt from 'bcrypt';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser } from '../../../db/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	// Only post request
	if (req.method !== 'POST') return res.json({ error: 'Wrong protocol' });

	let error;
	const { username, email, password, password2 } = req.body;

	// Check all fields were filled in
	if (!username || !email || !password || !password2) error = 'Please fill in all fields!';

	// check if passwords match
	if (password !== password2) error = 'Passwords dont match!';

	// check if password is more than 6 characters
	if (password.length <= 8) error = 'Password must be atleast 6 characters long!';

	// If an error was found notify user
	if (error) return res.json({ error });

	// Encrypt password (Dont save raw password to database)
	let Hashpassword;
	try {
		const salt = await bcrypt.genSalt(10);
		Hashpassword = await bcrypt.hash(password, salt);
	} catch (err: any) {
		console.log(err);
		return res.json({ error: err.message });
	}

	// Save the new user to database + make sure to create folder
	try {
		await createUser({ email, name: username, password: Hashpassword });
		res.json({ success: 'User successfully created' });
	} catch (err: any) {
		console.log(err);
		return res.json({ error: err.message });
	}
}
