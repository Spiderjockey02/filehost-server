import { Router } from 'express';
import { getAvatar, getThumbnail, getContent } from '../controllers';
import { Client } from 'src/utils';
const router = Router();

export default function(client: Client) {
	router.get('/avatar/:userId?', getAvatar());

	router.get('/thumbnail/:userid/:path(*)', getThumbnail(client));

	router.get('/content/:userid/:path(*)', getContent(client));

	return router;
}
