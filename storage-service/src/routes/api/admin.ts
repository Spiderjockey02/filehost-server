import { getStats, getUsers } from '../../controllers/admin';
import type Client from '../../helpers/Client';
import { checkAdmin } from '../../middleware';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.get('/stats', checkAdmin, getStats(client));

	router.get('/users', checkAdmin, getUsers(client));

	return router;
}
