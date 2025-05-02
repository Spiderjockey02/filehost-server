import type { Request, Response } from 'express';
import { Error, parseMySQLConnectionString, PATHS } from '../../utils';
import fs from 'fs/promises';
import Client from 'src/helpers/Client';
import { exec } from 'child_process';
import { existsSync } from 'fs';

// Endpoint: GET /api/admin/database/backups
export const getDatabaseBackups = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Check if the database backups folder exists
			if (!existsSync(PATHS.DATABASE_BACKUPS)) await fs.mkdir(PATHS.DATABASE_BACKUPS, { recursive: true });

			// Get list of files in the database backups folder
			const files = await fs.readdir(PATHS.DATABASE_BACKUPS);
			const backups = [];

			// Filter out files that are not .sql files and get their stats
			for (const file of files) {
				const stats = await fs.stat(`${PATHS.DATABASE_BACKUPS}/${file}`);
				if (stats.isFile() && file.endsWith('.sql')) {
					backups.push({
						name: file,
						size: stats.size,
						creationDate: stats.birthtime,
					});
				}
			}

			res.json({ backups });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get database backups.');
		}
	};
};

// Endpoint: POST /api/admin/database/backup
export const postDatabaseBack = (client: Client) => {
	return async (_req: Request, res: Response) => {
		const mysqlArgs = parseMySQLConnectionString(process.env.DATABASE_URL as string);

		try {
			// Check if the database backups folder exists
			if (!existsSync(PATHS.DATABASE_BACKUPS)) await fs.mkdir(PATHS.DATABASE_BACKUPS, { recursive: true });

			exec(`mysqldump -u ${mysqlArgs.username} -p${mysqlArgs.password} -n ${mysqlArgs.database} > "${PATHS.DATABASE_BACKUPS}/${new Date().getTime()}.dump.sql"`, (err) => {
				if (err) throw err;
				res.json({ Success: 'Successfully backed up database.' });
			});
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to create backup of database.');
		}
	};
};

// Endpoint: DELETE /api/admin/database/backup/:name
export const deleteBackupByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			// Check if the database backups folder exists
			if (!existsSync(PATHS.DATABASE_BACKUPS)) await fs.mkdir(PATHS.DATABASE_BACKUPS, { recursive: true });

			await fs.rm(`${PATHS.DATABASE_BACKUPS}/${req.params.name}`);
			res.json({ success: `Successfully deleted backup: ${req.params.name}` });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete database backup.');
		}
	};
};