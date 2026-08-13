import { buildYearlyHistory, buildMonthlyHistory, buildDailyHistory, buildHourlyHistory } from '@/utils/analyticTimeSeries';
import { validateAdminRecentlyUploaded, validateFileGrowth, validateGrouped } from '@/validators/endpointParams';
import type { Request, Response } from 'express';
import { Error, sanitiseObject } from '@/utils';
import type Client from '@/helpers/Client';
import type { CountMap } from '@/types';

// Endpoint: GET /api/admin/files
export const getFiles = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [{ files, folders, newFiles }, avgSize, mostCommonFileTypes, deletedFiles, size] = await Promise.all([
				client.FileManager.fetchTotal(),
				client.FileManager.fetchAverageSize(),
				client.FileManager.fetchFileMediaTypes({}),
				client.FileManager.fetchTotalDeleted(),
				client.FileManager.fetchTotalStorageUsed(),
			]);

			const mostCommonFileTypesCount = Object.fromEntries(Object.entries(mostCommonFileTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => [type, count]));
			res.json({ files, folders, avgFileSize: avgSize._avg.size, mostCommonFileTypes: mostCommonFileTypesCount, deletedFiles, newFiles, totalStorageSize: Number(size) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch files.');
		}
	};
};

// Endpoint: GET /api/admin/files/growth
export const getFilesGrowth = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { interval, storageId } = req.query;
		const result = validateFileGrowth.safeParse({ interval, storageId });
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		let data: CountMap = {};
		switch (result.data.interval) {
			case 'yearly': {
				data = await buildYearlyHistory({ func: client.FileManager.fetchUploadsBetweenTwoDates, params: result.data.storageId });
				return res.json({ data });
			}
			case 'monthly': {
				data = await buildMonthlyHistory({ func: client.FileManager.fetchUploadsBetweenTwoDates, params: result.data.storageId });
				return res.json({ data });
			}
			case 'daily': {
				data = await buildDailyHistory({ func: client.FileManager.fetchUploadsBetweenTwoDates, params: result.data.storageId });
				return res.json({ data });
			}
			case 'hourly': {
				data = await buildHourlyHistory({ func: client.FileManager.fetchUploadsBetweenTwoDates, params: result.data.storageId });
				return res.json({ data });
			}
		}
	};
};

// Endpoint: GET /api/admin/files/sized-categories
export const getFileSizeCategories = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const categories = await client.FileManager.fetchUploadSizeDistribution();
			res.json({ categories });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch file size categories.');
		}
	};
};

// Endpoint: GET /api/admin/files/recently-uploaded
export const getRecentlyUploaded = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			// Allow pagination
			const result = validateAdminRecentlyUploaded.safeParse(req.query);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const [files, total] = await Promise.all([
				client.FileManager.fetchRecentlyUploaded(result.data),
				client.FileManager.fetchTotal(result.data.userId),
			]);
			return res.json({ files: sanitiseObject(files), total: total.files });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch recently uploaded files.');
		}
	};
};

// Endpoint: GET /api/admin/files/mimetypes
export const getMimeTypes = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const result = validateGrouped.safeParse(req.query);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const mimeTypes = await client.FileManager.fetchFileMediaTypes(result.data);
			return res.json(mimeTypes);
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};