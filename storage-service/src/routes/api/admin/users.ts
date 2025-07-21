import { getUsers, getUserGrowth, getUsersByLanguageCode, getUserEmails, getUserById, getUserStats, getUserSessions, getUserSignupSource, getUserRetention, getUserByIdAccounts, banUserById } from '../../../controllers/admin/users';
import type Client from '../../../helpers/Client';
import { checkAdmin } from '../../../middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/', await checkAdmin(client), getUsers(client));

	router.get('/growth', await checkAdmin(client), getUserGrowth(client));

	router.get('/language-codes', await checkAdmin(client), getUsersByLanguageCode(client));

	router.get('/emails', await checkAdmin(client), getUserEmails(client));

	router.get('/signUp-source', await checkAdmin(client), getUserSignupSource(client));

	router.get('/stats', await checkAdmin(client), getUserStats(client));

	router.get('/sessions', await checkAdmin(client), getUserSessions(client));

	router.get('/retention', await checkAdmin(client), getUserRetention(client));

	router.get('/:id', await checkAdmin(client), getUserById(client));

	router.get('/:id/accounts', await checkAdmin(client), getUserByIdAccounts(client));

	router.post('/:id/ban', await checkAdmin(client), banUserById(client));

	return router;
}
