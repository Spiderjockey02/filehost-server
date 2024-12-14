import express from 'express';
import { Logger, generateRoutes } from './utils';
import config from './config';
import compression from 'compression';
import { fetchAllUsers, createUser } from './accessors/User';
import { fetchAllGroups, createGroup } from './accessors/Group';
import type { customRequest, customResponse } from './types';
import bcrypt from 'bcrypt';
import { join } from 'path';
import cors from 'cors';
const app = express();

(async () => {
	// Create 2 groups for normal users and admin
	const groups = await fetchAllGroups();
	if (groups.length == 0) {
		try {
			await Promise.all([createGroup({ name: 'Free' }), createGroup({ name: 'Admin' })]);
			Logger.log('Successfully created group(s): Free, Admin.');
		} catch (err) {
			console.log(err);
		}
	}

	// Create an admin account
	const users = await fetchAllUsers();
	if (users.length == 0) {
		try {
			const salt = await bcrypt.genSalt(10);
			const hashPassword = await bcrypt.hash('admin', salt);
			await createUser({ email: 'test@example.com', password: hashPassword, name: 'Admin' });
			Logger.log('Successfully created account: Admin');
			Logger.log(`Email: ${'test@example.com'}, password: ${'admin'}`);
		} catch (err) {
			console.log(err);
			Logger.error('Error creating Admin account');
		}
	}

	// Get all endpoints
	const endpoints = generateRoutes(join(__dirname, './', 'routes')).filter(e => e.route !== '/index');

	// Add endpoints to app
	app
		.use(cors({
			origin: config.frontendURL,
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
