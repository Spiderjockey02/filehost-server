import { getStorageById, getStorages, getStorageTypes, getUsersByStorageId, postStorage, postStorageByStorageId } from '../../../controllers/admin/storage';
import type Client from '../../../helpers/Client';
import { checkAdmin } from '../../../middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/', await checkAdmin(client), getStorages(client));

	router.get('/types', await checkAdmin(client), getStorageTypes(client));

	router.get('/:storageId', await checkAdmin(client), getStorageById(client));

	router.get('/:storageId/users', await checkAdmin(client), getUsersByStorageId(client));

	router.post('/', await checkAdmin(client), postStorage(client));

	router.post('/:storageId', await checkAdmin(client), postStorageByStorageId(client));

	return router;
}
