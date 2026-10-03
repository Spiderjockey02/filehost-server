import { deleteLogListener, getLogEvents, getLogFiles, getLogHistory, getLogListeners, getLogs, getLogTypes, getSpecificLog, postLogListener, patchLogListener } from '@/controllers/admin/logs';
import type Client from '@/helpers/Client';
import { checkAdmin } from '@/middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.use(await checkAdmin());

	router.get('/', getLogs(client));

	router.get('/types', getLogTypes(client));

	router.get('/history', getLogHistory(client));

	router.get('/events', getLogEvents(client));

	router.get('/listeners', getLogListeners(client));

	router.post('/listeners', postLogListener(client));

	router.delete('/listeners/:id', deleteLogListener(client));

	router.patch('/listeners/:id', patchLogListener(client));

	router.get('/files', getLogFiles(client));

	router.get('/files/:date', getSpecificLog(client));

	return router;
}