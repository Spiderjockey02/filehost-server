import { getFiles, getFilesGrowth, getFileSizeCategories, getRecentlyUploaded } from '../../controllers/admin/files';
import { getMimeTypes, getStats } from '../../controllers/admin';
import { getLogs, getSpecificLog } from '../../controllers/admin/logs';
import type Client from '../../helpers/Client';
import { checkAdmin } from '../../middleware';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.get('/stats', checkAdmin, getStats(client));

	router.get('/mimetypes', checkAdmin, getMimeTypes(client));

	router.get('/logs', checkAdmin, getLogs(client));

	router.get('/logs/:date', checkAdmin, getSpecificLog(client));

	router.get('/files/recently-uploaded', checkAdmin, getRecentlyUploaded(client));

	router.get('/files', checkAdmin, getFiles(client));

	router.get('/files/growth', checkAdmin, getFilesGrowth(client));

	router.get('/files/sized-categories', checkAdmin, getFileSizeCategories(client));

	return router;
}
