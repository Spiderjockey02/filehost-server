import { getFiles, getFilesGrowth, getFileSizeCategories, getRecentlyUploaded } from '../../controllers/admin/files';
import { getCronJobs, getCronJobsByName, getMimeTypes, getStats, postCronJobsByName } from '../../controllers/admin';
import { getLogs, getSpecificLog } from '../../controllers/admin/logs';
import type Client from '../../helpers/Client';
import { checkAdmin } from '../../middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/stats', await checkAdmin(client), getStats(client));

	router.get('/mimetypes', await checkAdmin(client), getMimeTypes(client));

	router.get('/logs', await checkAdmin(client), getLogs(client));

	router.get('/logs/:date', await checkAdmin(client), getSpecificLog(client));

	router.get('/files/recently-uploaded', await checkAdmin(client), getRecentlyUploaded(client));

	router.get('/files', await checkAdmin(client), getFiles(client));

	router.get('/files/growth', await checkAdmin(client), getFilesGrowth(client));

	router.get('/files/sized-categories', await checkAdmin(client), getFileSizeCategories(client));

	router.get('/cron-jobs', await checkAdmin(client), getCronJobs(client));

	router.get('/cron-jobs/:name/logs', await checkAdmin(client), getCronJobsByName(client));

	router.post('/cron-jobs/:name', await checkAdmin(client), postCronJobsByName(client));

	return router;
}
