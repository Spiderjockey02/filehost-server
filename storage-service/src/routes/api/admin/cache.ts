import { deleteCacheByName, getCachedStats, getCachedThumbnailSize } from '../../../controllers/admin/cache';
import type Client from '../../../helpers/Client';
import { checkAdmin } from '../../../middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/thumbnails', await checkAdmin(client), getCachedThumbnailSize(client));

	router.delete('/:name', await checkAdmin(client), deleteCacheByName(client));

	router.get('/stats', await checkAdmin(client), getCachedStats(client));
	return router;
}
