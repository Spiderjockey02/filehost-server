import { getConfig, getCronJobs, getCronJobsByName, getMimeTypesSearch, getStats, getSystemStats, postConfig, postCronJobsByName, postCronJobsByNameRun, postNotification } from '@/controllers/admin';
import { getActivityList, getActivityRequests, getActivityTraffic, getNetworkStats, getUserAgents } from '@/controllers/admin/network';
import { getFiles, getFilesGrowth, getFileSizeCategories, getMimeTypes, getRecentlyUploaded } from '@/controllers/admin/files';
import { deletePlan, getPlanStats, getPlanTrends, patchPlan, postPlan } from '@/controllers/admin/plans';
import type Client from '@/helpers/Client';
import { checkAdmin } from '@/middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/stats', await checkAdmin(client), getStats(client));

	router.get('/files/mimetypes', await checkAdmin(client), getMimeTypes(client));

	router.get('/files/recently-uploaded', await checkAdmin(client), getRecentlyUploaded(client));

	router.get('/files', await checkAdmin(client), getFiles(client));

	router.get('/files/growth', await checkAdmin(client), getFilesGrowth(client));

	router.get('/files/sized-categories', await checkAdmin(client), getFileSizeCategories(client));

	router.get('/cron-jobs', await checkAdmin(client), getCronJobs(client));

	router.get('/cron-jobs/:name/logs', await checkAdmin(client), getCronJobsByName(client));

	router.post('/cron-jobs/:name', await checkAdmin(client), postCronJobsByName(client));

	router.post('/cron-jobs/:name/run', await checkAdmin(client), postCronJobsByNameRun(client));

	router.get('/system/stats', await checkAdmin(client), getSystemStats(client));

	router.get('/network/stats', await checkAdmin(client), getNetworkStats(client));

	router.get('/network/requests', await checkAdmin(client), getActivityRequests(client));

	router.get('/network/traffic', await checkAdmin(client), getActivityTraffic(client));

	router.get('/network/list', await checkAdmin(client), getActivityList(client));

	router.get('/network/user-agents', await checkAdmin(client), getUserAgents(client));

	router.post('/notification', await checkAdmin(client), postNotification(client));

	router.get('/config', await checkAdmin(client), getConfig(client));

	router.post('/config', await checkAdmin(client), postConfig(client));

	router.get('/mime-types/search', await checkAdmin(client), getMimeTypesSearch());

	router.get('/plan/stats', await checkAdmin(client), getPlanStats(client));

	router.get('/plan/trends', await checkAdmin(client), getPlanTrends(client));

	router.post('/plan', await checkAdmin(client), postPlan(client));

	router.patch('/plan/:planId', await checkAdmin(client), patchPlan(client));

	router.delete('/plan/:planId', await checkAdmin(client), deletePlan(client));

	return router;
}
