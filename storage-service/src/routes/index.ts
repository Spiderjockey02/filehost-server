import { getAvatar, getThumbnail, getContent, getStatistics, getPlans, getFilesMetadata } from '@/controllers';
import { checkLoggedIn } from '@/middleware';
import type Client from '@/helpers/Client';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/avatar/:userId', getAvatar(client));

	router.get('/thumbnail/:userId{/:fileId}', await checkLoggedIn(), getThumbnail(client));

	router.get('/content/:userId{/:fileId}', await checkLoggedIn(), getContent(client));

	router.get('/api/metadata/:fileId', await checkLoggedIn(), getFilesMetadata(client));

	router.get('/api/statistics', getStatistics(client));

	router.get('/api/plans', getPlans(client));

	return router;
}
