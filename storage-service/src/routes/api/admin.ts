import { getConfig, getCronJobs, getCronJobsByName, getMimeTypesSearch, getStats, getSystemStats, postConfig, postCronJobsByName, postCronJobsByNameRun, postNotification } from '@/controllers/admin';
import { getActivityList, getActivityRequests, getActivityTraffic, getNetworkStats, getUserAgents } from '@/controllers/admin/network';
import { getFiles, getFilesGrowth, getFileSizeCategories, getMimeTypes, getRecentlyUploaded } from '@/controllers/admin/files';
import { deletePlan, getPlanStats, getPlanTrends, patchPlan, postPlan } from '@/controllers/admin/plans';
import type Client from '@/helpers/Client';
import { checkAdmin } from '@/middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.use(await checkAdmin());

	router.get('/stats', getStats(client));

	router.get('/files/mimetypes', getMimeTypes(client));

	router.get('/files/recently-uploaded', getRecentlyUploaded(client));

	router.get('/files', getFiles(client));

	router.get('/files/growth', getFilesGrowth(client));

	router.get('/files/sized-categories', getFileSizeCategories(client));

	router.get('/cron-jobs', getCronJobs(client));

	router.get('/cron-jobs/:name/logs', getCronJobsByName(client));

	router.post('/cron-jobs/:name', postCronJobsByName(client));

	router.post('/cron-jobs/:name/run', postCronJobsByNameRun(client));

	router.get('/system/stats', getSystemStats(client));

	router.get('/network/stats', getNetworkStats(client));

	router.get('/network/requests', getActivityRequests(client));

	router.get('/network/traffic', getActivityTraffic(client));

	router.get('/network/list', getActivityList(client));

	router.get('/network/user-agents', getUserAgents(client));

	router.post('/notification', postNotification(client));

	router.get('/config', getConfig(client));

	router.post('/config', postConfig(client));

	router.get('/mime-types/search', getMimeTypesSearch());

	router.get('/plan/stats', getPlanStats(client));

	router.get('/plan/trends', getPlanTrends(client));

	router.post('/plan', postPlan(client));

	router.patch('/plan/:planId', patchPlan(client));

	router.delete('/plan/:planId', deletePlan(client));

	return router;
}
