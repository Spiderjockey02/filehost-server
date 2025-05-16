import { getDatabaseBackups, postDatabaseBack, deleteBackupByName, downloadBackupByName } from '../../../controllers/admin/database';
import type Client from '../../../helpers/Client';
import { checkAdmin } from '../../../middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.get('/backups', await checkAdmin(client), getDatabaseBackups(client));

	router.post('/backup', await checkAdmin(client), postDatabaseBack(client));

	router.delete('/backup/:timestamp', await checkAdmin(client), deleteBackupByName(client));

	router.get('/backup/:timestamp', await checkAdmin(client), downloadBackupByName(client));

	return router;
}
