import { getUsers, getUserGrowth, getUsersByLanguageCode, getUserEmails, getUserById, getUserStats, getUserSessions, getUserSignupSource, getUserRetention } from '../../../controllers/admin/users';
import type Client from '../../../helpers/Client';
import { checkAdmin } from '../../../middleware';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.get('/', checkAdmin, getUsers(client));

	router.get('/growth', checkAdmin, getUserGrowth(client));

	router.get('/language-codes', checkAdmin, getUsersByLanguageCode(client));

	router.get('/emails', checkAdmin, getUserEmails(client));

	router.get('/signUp-source', checkAdmin, getUserSignupSource(client));

	router.get('/stats', checkAdmin, getUserStats(client));

	router.get('/sessions', checkAdmin, getUserSessions(client));

	router.get('/retention', checkAdmin, getUserRetention(client));

	router.get('/:id', checkAdmin, getUserById(client));

	return router;
}
