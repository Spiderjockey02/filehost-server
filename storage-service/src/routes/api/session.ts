import { Router } from 'express';
import { postChangeAvatar, postChangeEmail, postChangePassword } from '../../controllers/session';
const router = Router();

export default function() {
	router.post('/change-password', postChangePassword());

	router.post('/change-avatar', postChangeAvatar());

	router.post('/change-email', postChangeEmail());

	return router;
}
