import { Router } from 'express';
import { checkAdmin } from '../../middleware';
import { getStats, getUsers } from '../../controllers/admin';
const router = Router();

export default function() {
	router.get('/stats', checkAdmin, getStats());

	router.get('/users', checkAdmin, getUsers);

	return router;
}
