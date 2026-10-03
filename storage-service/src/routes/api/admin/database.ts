import { getDatabaseBackups, deleteBackupByName, downloadBackupByName } from '@/controllers/admin/database';
import type Client from '@/helpers/Client';
import { checkAdmin } from '@/middleware';
import { Router } from 'express';
const router = Router();

export default async function(client: Client) {
	router.use(await checkAdmin());

	router.get('/backups', getDatabaseBackups(client));

	router.delete('/backup/:timestamp', deleteBackupByName(client));

	router.get('/backup/:timestamp', downloadBackupByName(client));

	return router;
}
