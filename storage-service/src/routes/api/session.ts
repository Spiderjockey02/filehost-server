import { deleteNotification, deleteResetAvatar, getLinkedAccounts, getRecentlyViewed, getSessions,
	postChangeAvatar, postUserInformation, getTrash, deleteEmpty, putRestore, getUserGallery,
	getNotifications } from '@/controllers/session';
import type Client from '@/helpers/Client';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.post('/avatar/change', postChangeAvatar(client));

	router.delete('/avatar/reset', deleteResetAvatar(client));

	router.get('/recently-viewed', getRecentlyViewed(client));

	router.get('/notifications', getNotifications(client));

	router.delete('/notifications/:id', deleteNotification(client));

	router.get('/accounts', getLinkedAccounts(client));

	router.get('/list', getSessions(client));

	router.post('/user', postUserInformation(client));

	router.get('/trash', getTrash(client));

	router.delete('/trash/empty', deleteEmpty(client));

	router.put('/trash/restore', putRestore(client));

	router.get('/gallery', getUserGallery(client));

	return router;
}
