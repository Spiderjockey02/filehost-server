import { getAvatar, getThumbnail, getContent, getStatistics, getPlans, getUserGallery } from '../controllers';
import type Client from '../helpers/Client';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.get('/avatar/:userId', getAvatar(client));

	router.get('/thumbnail/:userid/*path', getThumbnail(client));

	router.get('/content/:userid/*path', getContent(client));

	router.get('/api/statistics', getStatistics(client));

	router.get('/api/plans', getPlans(client));

	router.get('/api/gallery', getUserGallery(client));

	return router;
}
