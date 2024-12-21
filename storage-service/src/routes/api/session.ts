import { Router } from 'express';
import { postChangeAvatar, postChangeEmail, postChangePassword } from '../../controllers/session';
import { Client } from 'src/helpers';
const router = Router();

export default function(client: Client) {
	router.post('/change-password', postChangePassword(client));

	router.post('/change-avatar', postChangeAvatar(client));

	router.post('/change-email', postChangeEmail(client));

	return router;
}
