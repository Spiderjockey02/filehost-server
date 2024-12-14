import { Router } from 'express';
import { postLogin, postRegister, getSessionUserId } from '../../controllers/auth';
const router = Router();

export default function() {
	router.post('/login', postLogin());

	router.post('/register', postRegister());

	router.get('/session/:userId', getSessionUserId());

	return router;
}
