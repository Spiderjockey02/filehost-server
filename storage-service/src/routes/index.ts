import { getAvatar, getThumbnail, getContent, getStatistics } from '../controllers';
import type Client from '../helpers/Client';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.get('/avatar/:userId', getAvatar(client));

	router.get('/thumbnail/:userid/*path', getThumbnail(client));

	router.get('/content/:userid/*path', getContent(client));

	router.get('/api/statistics', getStatistics(client));
	return router;
}
