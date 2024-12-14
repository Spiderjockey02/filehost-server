import { Router } from 'express';
import { getAvatar, getThumbnail, getContent } from '../controllers';
const router = Router();

export default function() {
	router.get('/avatar/:userId?', getAvatar());

	router.get('/thumbnail/:userid/:path(*)', getThumbnail());

	router.get('/content/:userid/:path(*)', getContent());

	return router;
}
