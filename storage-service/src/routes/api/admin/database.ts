import { getDatabaseBackups, postDatabaseBack, deleteBackupByName, downloadBackupByName } from '../../../controllers/admin/database';
import type Client from '../../../helpers/Client';
import { checkAdmin } from '../../../middleware';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	router.get('/backups', checkAdmin, getDatabaseBackups(client));

	router.post('/backup', checkAdmin, postDatabaseBack(client));

	router.delete('/backup/:timestamp', checkAdmin, deleteBackupByName(client));

	router.get('/backup/:timestamp', checkAdmin, downloadBackupByName(client));

	return router;
}
