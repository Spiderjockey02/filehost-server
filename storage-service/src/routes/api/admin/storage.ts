import { getStorages, getStorageTypes, postStorage } from '../../../controllers/admin/storage';
import type Client from '../../../helpers/Client';
import { checkAdmin } from '../../../middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/', await checkAdmin(client), getStorages(client));

	router.post('/', await checkAdmin(client), postStorage(client));

	router.get('/types', await checkAdmin(client), getStorageTypes(client));

	return router;
}
