import express from 'express';
import { generateRoutes, logUserActivity, PATHS } from './utils';
import compression from 'compression';
import type { customRequest, customResponse } from './types';
import { join } from 'path';
import cors from 'cors';
import Client from './helpers/Client';
import onFinished from 'on-finished';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { getSession } from './middleware';
import { createPlan, fetchDefaultPlan } from './accessors/Plan';

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: process.env.FRONTEND_URL,
		methods: ['GET', 'POST'],
	},
});
const client = new Client(io);

(async () => {
	// Create plans if not present
	const defaultPlan = await fetchDefaultPlan();
	if (defaultPlan == null) {
		await createPlan({
			name: 'Free',
			price: 0,
			maxStorageSize: BigInt(5 * 1024 * 1024 * 1024),
			isDefault: true,
		});
	}


	// Create a storage medium (if not exists) where files will be stored
	if (await client.FileManager.storageManager.fetchCount() < 3) {
		// Where files will be stored (by default)
		await client.FileManager.storageManager.create({
			name: 'Default Storage Medium',
			location: 'Europe',
			type: 'FILE_SYSTEM',
			basePath: PATHS.CONTENT,
		});

		// Where avatars will be stored
		await client.FileManager.storageManager.create({
			name: 'Avatars',
			location: 'Europe',
			type: 'FILE_SYSTEM',
			basePath: PATHS.AVATAR,
			avatarOnly: true,
		});
	}


	// Get all endpoints
	const endpoints = generateRoutes(join(__dirname, './', 'routes')).filter(e => e.route !== '/index');

	// Add endpoints to app
	app
		.set('trust proxy', true)
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
		.use(logUserActivity(client))
		.use(express.json())
		.use('/', (await import('./routes/index')).default(client));

	for (const endpoint of endpoints) {
		app.use(endpoint.route, await (await import(endpoint.path)).default(client));
	}

	// Handle socket.io connections
	io.on('connection', async (socket) => {
		const session = await getSession(client, socket.handshake.headers);
		if (session == null) {
			client.logger.error('Invalid session for socket connection');
			socket.disconnect();
			return;
		}

		client.logger.log(`Socket connected: ${session.user.name} (${session.user.id})`);
		socket.join(session.user.id);
	});

	server.listen(process.env.PORT, () => client.logger.ready(`Started on PORT: ${process.env.PORT}`));
})();
