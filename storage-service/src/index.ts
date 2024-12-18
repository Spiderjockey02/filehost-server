import express from 'express';
import { generateRoutes, Client } from './utils';
import config from './config';
import compression from 'compression';
import { fetchAllGroups, createGroup } from './accessors/Group';
import type { customRequest, customResponse } from './types';
import bcrypt from 'bcrypt';
import { join } from 'path';
import cors from 'cors';
const app = express();
const client = new Client();


(async () => {
	// Create 2 groups for normal users and admin
	const groups = await fetchAllGroups();
	if (groups.length == 0) {
		try {
			await Promise.all([createGroup({ name: 'Free' }), createGroup({ name: 'Admin' })]);
			client.logger.log('Successfully created group(s): Free, Admin.');
		} catch (err) {
			client.logger.error(err);
		}
	}

	// Create an admin account
	const users = await client.userManager.fetchAll();
	if (users.length == 0) {
		try {
			const salt = await bcrypt.genSalt(10);
			const hashPassword = await bcrypt.hash('admin', salt);
			await client.userManager.create({ email: 'test@example.com', password: hashPassword, name: 'Admin' });
			client.logger.log('Successfully created account: Admin');
			client.logger.log(`Email: ${'test@example.com'}, password: ${'admin'}`);
		} catch (err) {
			client.logger.error(err);
			client.logger.error('Error creating Admin account');
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
			if (req.originalUrl !== '/favicon.ico') {
				// Handle custom rate limits
				const newReq = req as customRequest;
				const newRes = res as customResponse;

				// Add time to request
				newReq._startTime = new Date().getTime();
				newReq._endTime = 0;

				// Add time to response
				newRes._startTime = new Date().getTime();
				newRes._endTime = 0;

				// Run logger & RateLimter
				client.logger.connection(newReq, newRes);

				// Display actually response
				next();
			}
		})
		.use(express.json())
		.use('/', (await import('./routes/index')).default(client));

	for (const endpoint of endpoints) {
		app.use(endpoint.route, (await import(endpoint.path)).default(client));
	}
	app.listen(config.port, () => client.logger.ready(`Started on PORT: ${config.port}`));
})();
