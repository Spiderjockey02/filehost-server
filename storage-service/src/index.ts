import express from 'express';
import { Logger } from './utils/Logger';
import config from './config';
import compression from 'compression';
import { getUsers, createUser, addUserToGroup } from './db/User';
import { getGroups, createGroup } from './db/Group';
import type { customRequest, customResponse } from './types';
import bcrypt from 'bcrypt';
const app = express();

(async () => {
	// Create an admin account
	const users = await getUsers();
	let user;
	if (users.length == 0) {
		try {
			const salt = await bcrypt.genSalt(10);
			const hashPassword = await bcrypt.hash('admin', salt);
			user = await createUser({ email: 'test@example.com', password: hashPassword, name: 'Admin' });
			Logger.log('Successfully created account: Admin');
			Logger.log(`Email: ${'test@example.com'}, password: ${'admin'}`);
		} catch (err) {
			console.log(err);
			Logger.error('Error creating Admin account');
		}
	}

	// Create 2 groups for normal users and admin
	const groups = await getGroups();
	if (groups.length == 0) {
		try {
			await createGroup({ name: 'Free' });
			const group = await createGroup({ name: 'Admin' });
			Logger.log('Successfully created group(s): Free, Admin.');

			// Link user to group
			if (user?.id !== undefined) await addUserToGroup({ groupId: group.id, userId: user?.id });
		} catch (err) {
			console.log(err);
		}
	}

	app
		.use(compression())
		.use((req, res, next) => {
			if (req.originalUrl !== '/favicon.ico') Logger.connection(req as customRequest, res as customResponse);
			next();
		})
		.use(express.json())
		.use('/', (await import('./routes/index')).default())
		.use('/file', (await import('./routes/file')).default())
		.use('/trash', (await import('./routes/trash')).default())
		.use('/api', (await import('./routes/api')).default())
		.use('/api/admin', (await import('./routes/api/admin')).default())
		.use('/api/user', (await import('./routes/api/user')).default())
		.listen(config.port, () => Logger.ready(`Started on PORT: ${config.port}`));
})();