import { fetchFileMediaTypes } from '../accessors/FileMimeType';
import { Error, sanitiseObject } from '../utils';
import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import os from 'os';

type data = { [key: string]: boolean}

// Endpoint: GET /api/admin/stats
export const getStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const diskData = client.FileManager.getFileSystemStatistics();
			const { files } = await client.FileManager.fetchTotal();

			res.json({
				storage: {
					totalFiles: files,
					total: diskData.total,
					free: diskData.free,
				},
				memory: {
					using: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
					total:  Number((os.totalmem() / 1024 / 1024).toFixed(2)),
				},
				cpu: {
					total: 0,
					avg: os.loadavg(),
				},
				users: await client.userManager.fetchTotal(),
			});
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch system statistics.');
		}
	};
};

// Endpoint: GET /api/admin/users
export const getUsers = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const rawFilters = req.query.filters;
			const filters = (rawFilters !== undefined && Array.isArray(rawFilters)) ? rawFilters.map((filter) => filter.toString()) : [];

			// Parse the filters and validate them
			const parsedFilters: data = {};
			for (const filter of filters) {
				if (['group', 'recent', 'delete', 'analyse'].includes(filter)) parsedFilters[filter] = true;
			}

			// Fetch the database
			const users = await client.userManager.fetchAll(parsedFilters);
			res.json({ users: sanitiseObject(users) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of users.');
		}
	};
};

// Endpoint: GET /api/admin/mimetypes
export const getMimeTypes = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const mimeTypes = await fetchFileMediaTypes();
			res.json({ mimeTypes });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};

// Endpoint: GET /api/admin/recently-uploaded
export const getRecentlyUploaded = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const files = await client.FileManager.fetchRecentlyUploaded();
			res.json({ files: sanitiseObject(files) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch recently uploaded files.');
		}
	};
};