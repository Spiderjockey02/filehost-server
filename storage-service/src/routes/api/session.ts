import { deleteNotification, deleteResetAvatar, getLinkedAccounts, getRecentlyViewed, getSessions, postChangeAvatar, postUserInformation } from '../../controllers/session';
import type Client from '../../helpers/Client';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.post('/avatar/change', postChangeAvatar(client));

	router.delete('/avatar/reset', deleteResetAvatar(client));

	router.get('/recently-viewed', getRecentlyViewed(client));

	router.delete('/notifications/:id', deleteNotification(client));

	router.get('/accounts', getLinkedAccounts(client));

	router.get('/list', getSessions(client));

	router.post('/user', postUserInformation(client));

	return router;
}
