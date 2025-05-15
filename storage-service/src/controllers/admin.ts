import { fetchFileMediaTypes } from '../accessors/FileMimeType';
import { Error } from '../utils';
import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import os from 'os';

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
					using: Number((process.memoryUsage().heapUsed).toFixed(2)),
					total:  Number((os.totalmem()).toFixed(2)),
				},
				cpu: {
					total: 0,
					avg: os.loadavg(),
				},
				users: await client.userManager.fetchTotal(),
				uptime: process.uptime(),
			});
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch system statistics.');
		}
	};
};

// Endpoint: GET /api/admin/mimetypes
export const getMimeTypes = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { grouped } = req.query;
			if (grouped && typeof grouped !== 'string') return Error.IncorrectQuery(res, 'grouped must be a string.');
			if (grouped && !['true', 'false'].includes(grouped)) return Error.IncorrectQuery(res, 'grouped must be either true or false.');

			const mimeTypes = await fetchFileMediaTypes(grouped === 'true');
			res.json({ mimeTypes });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};