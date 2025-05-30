import Client from 'src/helpers/Client';
import type { Request, Response } from 'express';
import { Error, sanitiseObject } from '../../utils';

// Endpoint: GET /api/admin/storage
export const getStorages = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const storages = await client.FileManager.storageManager.fetchAll();
			res.json({ storages: sanitiseObject(storages) });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to fetch storage mediums.');
		}
	};
};

// Endpoint: POST /api/admin/storage
export const postStorage = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { type, name, basePath, latitude, longitude, endpoint, maxSize, isPrivate } = req.body;

		// Required fields
		if (!type || typeof type !== 'string' || !['S3', 'FILE_SYSTEM'].includes(type.toUpperCase())) return Error.IncorrectQuery(res, `type is required and must be one of: ${['S3', 'FILE_SYSTEM'].join(', ')}.`);
		if (typeof name !== 'string' || name.trim() === '') return Error.IncorrectQuery(res, 'name is required and must be a non-empty string.');
		if (typeof basePath !== 'string' || basePath.trim() === '') return Error.IncorrectQuery(res, 'basePath is required and must be a non-empty string.');

		// Optional fields with type checks
		if (latitude !== undefined && typeof latitude !== 'number') return Error.IncorrectQuery(res, 'latitude must be a number if provided.');
		if (longitude !== undefined && typeof longitude !== 'number') return Error.IncorrectQuery(res, 'longitude must be a number if provided.');
		if (endpoint !== undefined && typeof endpoint !== 'string') return Error.IncorrectQuery(res, 'endpoint must be a string if provided.');
		if (maxSize !== undefined && (typeof maxSize !== 'number' || !Number.isInteger(maxSize) || maxSize < 0)) return Error.IncorrectQuery(res, 'maxSize must be a non-negative integer if provided.');
		if (isPrivate !== undefined && typeof isPrivate !== 'boolean') return Error.IncorrectQuery(res, 'isPrivate must be a boolean if provided.');

		try {
			const storage = await client.FileManager.storageManager.create({
				...req.body,
			});

			res.json({ success: 'Successfully created new storage medium.', storage });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to create new storage mediums.');
		}
	};
};

// Endpoint: GET /api/admin/storage/types
export const getStorageTypes = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const storages = await client.FileManager.storageManager.fetchCountPerType();
			res.json({ MediumCounts: storages });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to fetch storage mediums.');
		}
	};
};