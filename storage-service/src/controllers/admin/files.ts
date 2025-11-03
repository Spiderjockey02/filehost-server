import type { Request, Response } from 'express';
import Client from 'src/helpers/Client';
import { Error, sanitiseObject } from '../../utils';
import { validateFileGrowth, validateGrouped, validatePage } from '../../validators';
type countEnum = { [key: string | number]: number }

// Endpoint: GET /api/admin/files
export const getFiles = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [{ files, folders, newFiles }, avgSize, mostCommonFileTypes, deletedFiles, { _sum: { size } }] = await Promise.all([
				client.FileManager.fetchTotal(),
				client.FileManager.fetchAverageSize(),
				client.FileManager.fetchFileMediaTypes({}),
				client.FileManager.fetchTotalDeleted(),
				client.FileManager.fetchTotalStorageUsed(),
			]);

			const mostCommonFileTypesCount = Object.fromEntries(Object.entries(mostCommonFileTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => [type, count]));
			res.json({ files, folders, avgFileSize: avgSize._avg.size, mostCommonFileTypes: mostCommonFileTypesCount, deletedFiles, newFiles, totalStorageSize: Number(size) });
		} catch (error) {
			client.logger.error(error);
			Error.GenericError(res, 'Failed to fetch files.');
		}
	};
};

// Endpoint: GET /api/admin/files/growth
export const getFilesGrowth = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { frame, storageId } = req.query;
		const result = validateFileGrowth.safeParse({ frame, storageId });
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

		switch (result.data.frame) {
			case 'yearly': {
				const years: countEnum = {};
				const currentYear = new Date().getFullYear();
				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1), result.data.storageId);

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end, result.data.storageId);
					cumulativeTotal += files;
					years[currentYear - i] = cumulativeTotal;
				}
				res.json({ years });
				break;
			}
			case 'monthly': {
				const months: countEnum = {};
				const current = new Date();
				current.setDate(1);

				const firstMonthDate = new Date();
				firstMonthDate.setMonth(current.getMonth() - 11);

				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), new Date(firstMonthDate), result.data.storageId);
				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end, result.data.storageId);
					cumulativeTotal += files;
					months[monthName] = cumulativeTotal;
				}
				res.json({ months });
				break;
			}
			case 'daily': {
				const days: countEnum = {};
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const frameStart = new Date(today);
				frameStart.setDate(today.getDate() - 14);
				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), frameStart, result.data.storageId);

				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end, result.data.storageId);
					cumulativeTotal += files;
					days[dateStr] = cumulativeTotal;
				}
				res.json({ days });
				break;
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
		} catch (error) {
			client.logger.error(error);
			Error.GenericError(res, 'Failed to fetch file size categories.');
		}
	};
};

// Endpoint: GET /api/admin/files/recently-uploaded
export const getRecentlyUploaded = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			// Allow pagination
			const { page, userId } = req.query;
			const result = validatePage.safeParse(page);
			if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

			const [files, total] = await Promise.all([
				client.FileManager.fetchRecentlyUploaded({ page: result.data, userId: userId ? `${userId}` : undefined }),
				client.FileManager.fetchTotal(userId ? `${userId}` : undefined),
			]);
			res.json({ files: sanitiseObject(files), total: total.files });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch recently uploaded files.');
		}
	};
};

// Endpoint: GET /api/admin/files/mimetypes
export const getMimeTypes = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { grouped, type } = req.query;
			const result = validateGrouped.safeParse({ grouped, type });
			if (!result.success) return Error.IncorrectQuery(res, result.error?.issues[0].message);

			const mimeTypes = await client.FileManager.fetchFileMediaTypes({ ...result.data });
			res.json({ mimeTypes });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};