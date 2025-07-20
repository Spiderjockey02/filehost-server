import type { Request, Response } from 'express';
import Client from 'src/helpers/Client';
import { Error, sanitiseObject } from '../../utils';
type countEnum = { [key: string | number]: number }

// Endpoint: GET /api/admin/files
export const getFiles = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [{ files, folders, newFiles }, avgSize, mostCommonFileTypes, deletedFiles, { _sum: { size } }] = await Promise.all([
				client.FileManager.fetchTotal(),
				client.FileManager.fetchAverageSize(),
				client.FileManager.fetchFileMediaTypes(),
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
	// Get time frame and validate it
		const { frame, storageId } = req.query;

		if (storageId && typeof storageId !== 'string') return Error.IncorrectQuery(res, 'storageId must be a string.');
		if (!frame || typeof frame !== 'string' || !['yearly', 'monthly', 'daily'].includes(frame)) return Error.IncorrectQuery(res, `frame must be on one of the following: ${['yearly', 'monthly', 'daily'].join(', ')}`);

		switch (frame) {
			case 'yearly': {
				const years: countEnum = {};
				const currentYear = new Date().getFullYear();
				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1), storageId);

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end, storageId);
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

				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), new Date(firstMonthDate), storageId);
				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end, storageId);
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
				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), frameStart, storageId);

				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end, storageId);
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

			// Validate page
			if (page !== undefined && (typeof page !== 'string' || !/^\d+$/.test(page) || Number(page) < 0)) return Error.IncorrectQuery(res, 'page must be a positive number.');

			const [files, total] = await Promise.all([
				client.FileManager.fetchRecentlyUploaded({ page: isNaN(Number(page)) ? undefined : Number(page), userId: userId ? `${userId}` : undefined }),
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
			const { grouped } = req.query;
			if (grouped && typeof grouped !== 'string') return Error.IncorrectQuery(res, 'grouped must be a string.');
			if (grouped && !['true', 'false'].includes(grouped)) return Error.IncorrectQuery(res, 'grouped must be either true or false.');

			const mimeTypes = await client.FileManager.fetchFileMediaTypes(grouped === 'true');
			res.json({ mimeTypes });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of mime types.');
		}
	};
};