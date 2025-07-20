import Client from 'src/helpers/Client';
import type { Request, Response } from 'express';
import { Error, sanitiseObject } from '../../utils';

// Endpoint: GET /api/admin/storage
export const getStorages = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { page } = req.query;
			// Valid page index (if present)
			if (page !== undefined && (typeof page !== 'string' || !/^\d+$/.test(page) || Number(page) < 0)) return Error.IncorrectQuery(res, 'page must be a positive number.');

			const avgStorageUsage = await client.FileManager.storageManager.fetchAvgStorageUsage();
			const avgFileCount = await client.FileManager.storageManager.fetchAvgFileCount();
			const storages = await client.FileManager.storageManager.fetchAll({ page: isNaN(Number(page)) ? undefined : Number(page) });

			res.json({ storages: sanitiseObject(storages), avgFileCount, avgStorageUsage });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to fetch storage mediums.');
		}
	};
};

// Endpoint: GET /api/admin/storage/:storageId
export const getStorageById = (client: Client) => {
	return async (req: Request, res: Response) => {
		const storageId = req.params.storageId;

		try {
			const storage = await client.FileManager.storageManager.fetchById(storageId);
			if (!storage) return Error.IncorrectQuery(res, 'Storage not found.');
			res.json({ storage: sanitiseObject(storage) });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to fetch storage medium.');
		}
	};
};


// Endpoint: POST /api/admin/storage
export const postStorage = (client: Client) => {
	return async (req: Request, res: Response) => {
		const { type, name, basePath, location, endpoint, maxSize, isPrivate } = req.body;
		// Required fields
		if (!type || typeof type !== 'string' || (type !== 'S3' && type !== 'FILE_SYSTEM')) return Error.IncorrectQuery(res, `type is required and must be one of: ${['S3', 'FILE_SYSTEM'].join(', ')}.`);
		if (typeof name !== 'string' || name.trim() === '') return Error.IncorrectQuery(res, 'name is required and must be a non-empty string.');
		if (typeof basePath !== 'string' || basePath.trim() === '') return Error.IncorrectQuery(res, 'basePath is required and must be a non-empty string.');

		// Optional fields with type checks
		if (location !== undefined && typeof location !== 'string') return Error.IncorrectQuery(res, 'location must be a number if provided.');
		if (endpoint !== undefined && typeof endpoint !== 'string') return Error.IncorrectQuery(res, 'endpoint must be a string if provided.');

		if (maxSize !== undefined && (isNaN(maxSize) || maxSize < 0)) return Error.IncorrectQuery(res, 'maxSize must be a non-negative integer if provided.');
		if (isPrivate !== undefined && typeof isPrivate !== 'boolean') return Error.IncorrectQuery(res, 'isPrivate must be a boolean if provided.');

		try {
			const storage = await client.FileManager.storageManager.create({
				type,
				name,
				basePath,
				location,
				endpoint,
				maxSize: BigInt(Number(maxSize) * 1024 * 1024),
			});

			const medium = client.FileManager.storageManager.getProvider(storage);
			await medium.verifyConnection();
			res.json({ success: 'Successfully created new storage medium.', storage: sanitiseObject(storage) });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to create new storage medium.');
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

// Endpoint: POST /api/admin/storage/:storageId
export const postStorageByStorageId = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const storageId = req.params.storageId;
			const { name, maxSize, isPrivate } = req.body;

			if (storageId !== undefined && typeof storageId !== 'string') return Error.IncorrectQuery(res, 'storageId must be a valid string.');
			if (name !== undefined && typeof name !== 'string') return Error.IncorrectQuery(res, 'name must be a valid string.');
			if (maxSize !== undefined && (isNaN(maxSize) || maxSize < 0)) return Error.IncorrectQuery(res, 'maxSize must be a non-negative integer.');
			if (isPrivate !== undefined && typeof isPrivate !== 'boolean') return Error.IncorrectQuery(res, 'isPrivate must be a boolean.');

			// Fetch storage to ensure new maxSize does not exceed current usage
			const storage = await client.FileManager.storageManager.fetchById(storageId);
			if (!storage) return Error.IncorrectQuery(res, 'Storage not found.');
			if (maxSize !== undefined && maxSize < storage.usedSize) return Error.IncorrectQuery(res, 'maxSize must be greater than current usage.');

			// Update storage
			const newStorage = await client.FileManager.storageManager.update({
				id: storageId,
				name: name,
				maxSize: maxSize,
				isPrivate: isPrivate,
			});
			res.json({ success: 'Successfully updated storage.', storage: sanitiseObject(newStorage) });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to update storage.');
		}
	};
};

// Endpoint: GET /api/admin/storage/:storageId/users
export const getUsersByStorageId = (client: Client) => {
	return async (req: Request, res: Response) => {
		const storageId = req.params.storageId;

		// Valid page index (if present)
		const { page } = req.query;
		if (page !== undefined && (typeof page !== 'string' || !/^\d+$/.test(page) || Number(page) < 0)) return Error.IncorrectQuery(res, 'page must be a positive number.');

		try {
			const users = await client.userManager.fetchByStorageId({ storageId, page: isNaN(Number(page)) ? undefined : Number(page) });
			res.json({ users: sanitiseObject(users) });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to fetch storage mediums.');
		}
	};
};