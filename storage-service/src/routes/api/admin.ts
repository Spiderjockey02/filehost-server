import { getFiles, getFilesGrowth, getFileSizeCategories, getMimeTypes, getRecentlyUploaded } from '../../controllers/admin/files';
import { getCronJobs, getCronJobsByName, getStats, getSystemStats, postCronJobsByName } from '../../controllers/admin';
import { getLogs, getSpecificLog } from '../../controllers/admin/logs';
import type Client from '../../helpers/Client';
import { checkAdmin } from '../../middleware';
import { Router } from 'express';
import { getActivityList, getActivityRequests, getActivityTraffic, getNetworkStats } from '../../controllers/admin/network';
const router = Router();

export default async function(client: Client) {
	router.get('/stats', await checkAdmin(client), getStats(client));

	router.get('/logs', await checkAdmin(client), getLogs(client));

	router.get('/logs/:date', await checkAdmin(client), getSpecificLog(client));

	router.get('/files/mimetypes', await checkAdmin(client), getMimeTypes(client));

	router.get('/files/recently-uploaded', await checkAdmin(client), getRecentlyUploaded(client));

	router.get('/files', await checkAdmin(client), getFiles(client));

	router.get('/files/growth', await checkAdmin(client), getFilesGrowth(client));

	router.get('/files/sized-categories', await checkAdmin(client), getFileSizeCategories(client));

	router.get('/cron-jobs', await checkAdmin(client), getCronJobs(client));

	router.get('/cron-jobs/:name/logs', await checkAdmin(client), getCronJobsByName(client));

	router.post('/cron-jobs/:name', await checkAdmin(client), postCronJobsByName(client));

	router.get('/system/stats', await checkAdmin(client), getSystemStats());

	router.get('/network/stats', await checkAdmin(client), getNetworkStats(client));

	router.get('/network/requests', await checkAdmin(client), getActivityRequests());

	router.get('/network/traffic', await checkAdmin(client), getActivityTraffic());

	router.get('/network/list', await checkAdmin(client), getActivityList(client));

	return router;
}
