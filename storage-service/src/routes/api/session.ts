import { Router } from 'express';
import { deleteNotification, deleteResetAvatar, getRecentlyViewed, postChangeAvatar } from '../../controllers/session';
import { Client } from 'src/helpers';
const router = Router();

export default function(client: Client) {
	router.post('/change-avatar', postChangeAvatar(client));

	router.delete('/reset-avatar', deleteResetAvatar(client));

	router.get('/recently-viewed', getRecentlyViewed(client));

	router.delete('/notifications/:id', deleteNotification(client));

	return router;
}
