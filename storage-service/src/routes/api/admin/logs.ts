import { deleteLogListener, getLogEvents, getLogFiles, getLogHistory, getLogListeners, getLogs, getLogTypes, getSpecificLog, postLogListener, patchLogListener } from '@/controllers/admin/logs';
import type Client from '@/helpers/Client';
import { checkAdmin } from '@/middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/', await checkAdmin(client), getLogs(client));

	router.get('/types', await checkAdmin(client), getLogTypes(client));

	router.get('/history', await checkAdmin(client), getLogHistory(client));

	router.get('/events', await checkAdmin(client), getLogEvents(client));

	router.get('/listeners', await checkAdmin(client), getLogListeners(client));

	router.post('/listeners', await checkAdmin(client), postLogListener(client));

	router.delete('/listeners/:id', await checkAdmin(client), deleteLogListener(client));

	router.patch('/listeners/:id', await checkAdmin(client), patchLogListener(client));

	router.get('/files', await checkAdmin(client), getLogFiles(client));

	router.get('/files/:date', await checkAdmin(client), getSpecificLog(client));

	return router;
}