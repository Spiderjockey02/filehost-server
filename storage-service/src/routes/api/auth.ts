import { Router } from 'express';
import { postLogin, postRegister, getSessionUserId } from '../../controllers/auth';
import { Client } from '../../utils';
const router = Router();

export default function(client: Client) {
	router.post('/login', postLogin(client));

	router.post('/register', postRegister(client));

	router.get('/session/:userId', getSessionUserId(client));

	return router;
}
