import type { Request, Response } from 'express';
import { fetchMostCommonFileTypes } from '../../accessors/FileMimeType';
import Client from 'src/helpers/Client';
import { Error, sanitiseObject } from '../../utils';
type countEnum = { [key: string | number]: number }

// Endpoint: GET /api/admin/files
export const getFiles = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const { files, folders } = await client.FileManager.fetchTotal();
			const avgSize = await client.FileManager.fetchAverageSize();
			const mostCommonFileTypes = await fetchMostCommonFileTypes();

			res.json({ files, folders, avgFileSize: avgSize._avg.size, mostCommonFileTypes: mostCommonFileTypes.map(m => ({ mimeType: m.name, count: m._count.files })) });
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
		const frame = req.query.frame;
		if (!frame || typeof frame !== 'string' || !['yearly', 'monthly', 'daily'].includes(frame)) return Error.IncorrectQuery(res, `frame must be on one of the following: ${['yearly', 'monthly', 'daily'].join(', ')}`);

		switch (frame) {
			case 'yearly': {
				const years: countEnum = {};
				const currentYear = new Date().getFullYear();
				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1));

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end);
					cumulativeTotal += files;
					years[currentYear - i] = cumulativeTotal;
				}
				return res.json({ years });
			}
			case 'monthly': {
				const months: countEnum = {};
				const current = new Date();
				current.setDate(1);

				const firstMonthDate = new Date();
				firstMonthDate.setMonth(current.getMonth() - 11);

				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), new Date(firstMonthDate));
				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end);
					cumulativeTotal += files;
					months[monthName] = cumulativeTotal;
				}
				return res.json({ months });
			}
			case 'daily': {
				const days: countEnum = {};
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const frameStart = new Date(today);
				frameStart.setDate(today.getDate() - 14);
				let cumulativeTotal = await client.FileManager.fetchUploadsBetweenTwoDates(new Date(2023, 0, 1), frameStart);

				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const files = await client.FileManager.fetchUploadsBetweenTwoDates(start, end);
					cumulativeTotal += files;
					days[dateStr] = cumulativeTotal;
				}
				return res.json({ days });
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
			const { page, pageSize } = req.query;

			// Validate page and pageSize
			if (page !== undefined && (typeof page !== 'string' || !/^\d+$/.test(page) || Number(page) < 0)) return Error.IncorrectQuery(res, 'page must be a positive number.');
			if (pageSize !== undefined && (typeof pageSize !== 'string' || !/^\d+$/.test(pageSize) || Number(pageSize) < 0)) return Error.IncorrectQuery(res, 'page must be a number');

			const files = await client.FileManager.fetchRecentlyUploaded({ page: isNaN(Number(page)) ? undefined : Number(page), pageSize: isNaN(Number(pageSize)) ? undefined : Number(pageSize) });
			res.json({ files: sanitiseObject(files) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch recently uploaded files.');
		}
	};
};