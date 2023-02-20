import express from 'express';
import { Logger } from './utils/Logger';
import config from './config';
import compression from 'compression';
import { getUsers, createUser, addUserToGroup } from './db/User';
import { getGroups, createGroup } from './db/Group';
import type { customRequest, customResponse } from './types';
import { generateRoutes } from './utils/functions';
import bcrypt from 'bcrypt';
import { join } from 'path';
import cors from 'cors';
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

	// Get all endpoints
	const endpoints = generateRoutes(join(__dirname, './', 'routes')).filter(e => e.route !== '/index');
	console.log(endpoints);
	// Add endpoints to app
	app
		.use(cors({
			origin: 'http://192.168.0.14:3000',
		}))
		.use(compression())
		.use((req, res, next) => {
			if (req.originalUrl !== '/favicon.ico') Logger.connection(req as customRequest, res as customResponse);
			next();
		})
		.use(express.json())
		.use('/', (await import('./routes/index')).default());

	for (const endpoint of endpoints) {
		app.use(endpoint.route, (await import(endpoint.path)).default());
	}
	app.listen(config.port, () => Logger.ready(`Started on PORT: ${config.port}`));
})();
