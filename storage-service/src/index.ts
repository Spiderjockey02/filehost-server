import express from 'express';
import { generateRoutes } from './utils';
import compression from 'compression';
import type { customRequest, customResponse } from './types';
import { join } from 'path';
import cors from 'cors';
import Client from './helpers/Client';
import onFinished from 'on-finished';
const app = express();
const client = new Client();


(async () => {
	// Create 2 groups for normal users and admin
	const groups = await client.groupManager.fetchAll();
	if (groups.length == 0) {
		try {
			await Promise.all([client.groupManager.create({ name: 'Free' }), client.groupManager.create({ name: 'Admin' })]);
			client.logger.log('Successfully created group(s): Free, Admin.');
		} catch (err) {
			client.logger.error(err);
		}
	}

	// Get all endpoints
	const endpoints = generateRoutes(join(__dirname, './', 'routes')).filter(e => e.route !== '/index');

	// Add endpoints to app
	app
		.use(cors({
			origin: process.env.FRONTEND_URL,
		}))
		.use(compression())
		.use((req, res, next) => {
			const newReq = req as customRequest;
			const newRes = res as customResponse;

			// Add time to request
			newReq._startTime = new Date().getTime();
			newReq._endTime = 0;

			// Add time to response
			newRes._startTime = new Date().getTime();
			newRes._endTime = 0;

			onFinished(res, async () => {
				await client.logger.connection(newReq, newRes);
			});

			// Display actually response
			next();
		})
		.use(express.json())
		.use('/', (await import('./routes/index')).default(client));

	for (const endpoint of endpoints) {
		app.use(endpoint.route, await (await import(endpoint.path)).default(client));
	}
	app.listen(process.env.PORT, () => client.logger.ready(`Started on PORT: ${process.env.PORT}`));
})();
