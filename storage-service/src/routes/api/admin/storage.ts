import { deleteStorageById, getStorageById, getStorages, getStorageTypes, postMigrateUserFromStorage, postStorage, postStorageByStorageId } from '@/controllers/admin/storage';
import type Client from '@/helpers/Client';
import { checkAdmin } from '@/middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.use(await checkAdmin());

	router.get('/', getStorages(client));

	router.get('/types', getStorageTypes(client));

	router.get('/:storageId', getStorageById(client));

	router.post('/', postStorage(client));

	router.post('/:storageId', postStorageByStorageId(client));

	router.delete('/:storageId', deleteStorageById(client));

	router.post('/:storageId/migrate', postMigrateUserFromStorage(client));

	return router;
}
