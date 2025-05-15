import { deleteCacheByName, getCachedStats, getCachedThumbnailSize } from '../../../controllers/admin/cache';
import type Client from '../../../helpers/Client';
import { checkAdmin } from '../../../middleware';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.get('/thumbnails', checkAdmin, getCachedThumbnailSize(client));

	router.delete('/:name', checkAdmin, deleteCacheByName(client));

	router.get('/stats', checkAdmin, getCachedStats(client));
	return router;
}
