import { deleteCacheByName, getCachedStats } from '@/controllers/admin/cache';
import type Client from '@/helpers/Client';
import { checkAdmin } from '@/middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.use(await checkAdmin());

	router.delete('/:name', deleteCacheByName(client));

	router.get('/stats', getCachedStats(client));

	return router;
}
