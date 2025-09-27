import type { Request, Response } from 'express';
import { Error, PATHS } from '../../utils';
import Client from 'src/helpers/Client';
import { existsSync } from 'fs';
import fs from 'fs/promises';

// Endpoint: GET /api/admin/database/backups
export const getDatabaseBackups = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Check if the database backups folder exists
			if (!existsSync(PATHS.DATABASE_BACKUPS)) await fs.mkdir(PATHS.DATABASE_BACKUPS, { recursive: true });

			// Get list of JSON files in the database backups folder
			let files = await fs.readdir(PATHS.DATABASE_BACKUPS);
			files = files.filter((f) => f.endsWith('.json'));

			// Read each file and parse the JSON data
			const backups = await Promise.all(
				files.map(async (file) => {
					const filePath = `${PATHS.DATABASE_BACKUPS}/${file}`;
					const stats = await fs.stat(filePath);
					if (!stats.isFile()) return null;

					const data = await fs.readFile(filePath, 'utf-8');
					return JSON.parse(data);
				}),
			);
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
			const timestamp = req.params.timestamp;
			const regex = /^(\d+)\.dump\.sql$/;

			const match = timestamp.match(regex);
			if (!match) return Error.IncorrectQuery(res, 'Timestamp is an invalid format.');
			const number = match[1];

			// Check if the database backups folder exists
			if (!existsSync(`${PATHS.DATABASE_BACKUPS}/${number}.dump.sql`)) return Error.MissingResource(res, 'Database backup not found.');

			// Delete the backup files
			await Promise.all([
				fs.rm(`${PATHS.DATABASE_BACKUPS}/${number}.meta.json`),
				fs.rm(`${PATHS.DATABASE_BACKUPS}/${number}.dump.sql`),
			]);

			res.json({ success: `Successfully deleted backup: ${number}` });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete database backup.');
		}
	};
};

// Endpoint: GET /api/admin/database/backup/:timestamp
export const downloadBackupByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const timestamp = req.params.timestamp;
			const regex = /^(\d+)\.dump\.sql$/;

			const match = timestamp.match(regex);
			if (!match) return Error.IncorrectQuery(res, 'Timestamp is an invalid format.');
			const number = match[1];

			// Check if the database backups folder exists
			if (!existsSync(`${PATHS.DATABASE_BACKUPS}/${number}.dump.sql`)) return Error.MissingResource(res, 'Database backup not found.');

			res.download(`${PATHS.DATABASE_BACKUPS}/${number}.dump.sql`);
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to download database backup.');
		}
	};
};