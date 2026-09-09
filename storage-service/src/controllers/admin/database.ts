import { validateBackup } from '@/validators/endpointParams';
import type { Request, Response } from 'express';
import type Client from '@/helpers/Client';
import { Error, PATHS } from '@/utils';
import dbClient from '@/accessors';
import { existsSync } from 'fs';

// Endpoint: GET /api/admin/database/backups
export const getDatabaseBackups = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const backups = await dbClient.$getBackups();
			res.json({ backups });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get database backups.');
		}
	};
};

// Endpoint: DELETE /api/admin/database/backup/:timestamp
export const deleteBackupByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const result = validateBackup.safeParse(req.params);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			await dbClient.deleteBackup(result.data.timestamp);
			return res.json({ success: `Successfully deleted backup: ${result.data.timestamp}.` });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to delete database backup.');
		}
	};
};

// Endpoint: GET /api/admin/database/backup/:timestamp
export const downloadBackupByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const result = validateBackup.safeParse(req.params);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			// Check if the database backups folder exists
			if (!existsSync(`${PATHS.DATABASE_BACKUPS}/${result.data.timestamp}.dump.sql`)) return Error.MissingResource(res);
			res.download(`${PATHS.DATABASE_BACKUPS}/${result.data.timestamp}.dump.sql`);
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to download database backup.');
		}
	};
};