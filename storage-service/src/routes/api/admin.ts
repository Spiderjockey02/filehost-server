import { Router } from 'express';
import { checkAdmin } from '../../middleware';
import { getStats, getUsers } from '../../controllers/admin';
import { Client } from 'src/helpers';
const router = Router();

export default function(client: Client) {
	router.get('/stats', checkAdmin, getStats(client));

	router.get('/users', checkAdmin, getUsers(client));

	return router;
}
