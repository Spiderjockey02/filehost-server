import { getMimeTypes, getRecentlyUploaded, getStats } from '../../controllers/admin';
import { getUsers, getUserGrowth } from '../../controllers/admin/users';
import { getLogs, getSpecificLog } from '../../controllers/admin/logs';
import type Client from '../../helpers/Client';
import { checkAdmin } from '../../middleware';
import { Router } from 'express';
import { getDatabaseBackups, postDatabaseBack, deleteBackupByName } from '../../controllers/admin/database';
const router = Router();

export default function(client: Client) {
	router.get('/stats', checkAdmin, getStats(client));

	router.get('/users', checkAdmin, getUsers(client));

	router.get('/users/growth', checkAdmin, getUserGrowth(client));

	router.get('/mimetypes', checkAdmin, getMimeTypes(client));

	router.get('/recently-uploaded', checkAdmin, getRecentlyUploaded(client));

	router.get('/logs', checkAdmin, getLogs(client));

	router.get('/logs/:date', checkAdmin, getSpecificLog(client));

	router.get('/database/backups', checkAdmin, getDatabaseBackups(client));

	router.post('/database/backup', checkAdmin, postDatabaseBack(client));

	router.delete('/database/backup/:timestamp', checkAdmin, deleteBackupByName(client));

	return router;
}
