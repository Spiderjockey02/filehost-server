import { getUsers, getUserGrowth, getUsersByLanguageCode, getUserEmails, getUserById, getUserStats, getUserSessions, getUserSignupSource,
	getUserRetention, getUserByIdAccounts, banUserById, getUsersNotification, getUsersLogs } from '@/controllers/admin/users';
import type Client from '@/helpers/Client';
import { checkAdmin } from '@/middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.use(await checkAdmin());

	router.get('/', getUsers(client));

	router.get('/growth', getUserGrowth(client));

	router.get('/language-codes', getUsersByLanguageCode(client));

	router.get('/emails', getUserEmails(client));

	router.get('/signUp-source', getUserSignupSource(client));

	router.get('/stats', getUserStats(client));

	router.get('/sessions', getUserSessions(client));

	router.get('/retention', getUserRetention(client));

	router.get('/:id', getUserById(client));

	router.get('/:id/accounts', getUserByIdAccounts(client));

	router.post('/:id/ban', banUserById(client));

	router.get('/:id/notifications', getUsersNotification(client));

	router.get('/:id/logs', getUsersLogs(client));

	return router;
}
