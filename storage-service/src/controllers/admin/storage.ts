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

// Endpoint: DELETE /api/admin/storage/:storageId
export const deleteStorageById = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { storageId } = req.params;
			const storage = await client.FileManager.storageManager.fetchById(storageId);
			if (storage == null) return Error.IncorrectQuery(res, 'storageId is invalid');

			// Ensure no users or files are attached to this before deleting
			if (storage._count.files > 0 || storage._count.users > 0) return Error.GenericError(res, 'Storage is not empty');
			await client.FileManager.storageManager.delete(storage.id);

			res.json({ success: 'Successfully deleted storage.' });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to delete storage medium.');
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

		if (maxSize !== undefined && (isNaN(maxSize) || maxSize < 0 || !Number.isInteger(maxSize))) return Error.IncorrectQuery(res, 'maxSize must be a non-negative integer if provided.');
		if (isPrivate !== undefined && typeof isPrivate !== 'boolean') return Error.IncorrectQuery(res, 'isPrivate must be a boolean if provided.');

		try {
			const storage = await client.FileManager.storageManager.create({
				type,
				name,
				basePath,
				location,
				endpoint,
				maxSize: BigInt(Number(maxSize) * (1024 ** 3)),
			});

			const medium = await client.FileManager.storageManager.getProvider(storage);
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
			if (maxSize !== undefined && (isNaN(maxSize) || maxSize < 0 || !Number.isInteger(maxSize))) return Error.IncorrectQuery(res, 'maxSize must be a non-negative integer.');
			if (isPrivate !== undefined && typeof isPrivate !== 'boolean') return Error.IncorrectQuery(res, 'isPrivate must be a boolean.');

			// Fetch storage to ensure new maxSize does not exceed current usage
			const storage = await client.FileManager.storageManager.fetchById(storageId);
			if (!storage) return Error.IncorrectQuery(res, 'Storage not found.');
			const newMaxSize = Number(maxSize) * (1024 ** 3);
			if (newMaxSize < storage.usedSize) return Error.IncorrectQuery(res, 'maxSize must be greater than current usage.');

			// Update storage
			const newStorage = await client.FileManager.storageManager.update({
				id: storageId,
				name: name,
				maxSize: BigInt(newMaxSize),
				isPrivate: isPrivate,
			});
			res.json({ success: 'Successfully updated storage.', storage: sanitiseObject(newStorage) });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to update storage.');
		}
	};
};

// Endpoint: POST /api/admin/storage/:storageId/migrate
export const postMigrateUserFromStorage = (client: Client) => {
	return async (req: Request, res: Response) => {
		const storageId = req.params.storageId;
		const { userId } = req.query;
		if (typeof userId !== 'string') return Error.IncorrectQuery(res, 'userId must be string.');

		// Fetch all user's files
		const files = await client.FileManager.fetchAllByUserId(userId);
		await client.userManager.update({ id: userId, isMigrating: true });

		const storage = await client.FileManager.storageManager.fetchById(storageId);
		if (storage == null) return Error.GenericError(res, 'storageId is invalid');

		const newProvider = await client.FileManager.storageManager.getProviderById(storageId);
		const isProviderOnline = await newProvider.verifyConnection();
		if (!isProviderOnline) return Error.GenericError(res, 'Storage medium is not online');

		// Make sure that if the all the files moved it won't go over the new storage medium usage limit
		const totalFileSize = files.reduce((a, b) => a + b.size, 0n);
		if (storage.usedSize + totalFileSize > storage.maxSize) return Error.GenericError(res, 'Total files exceed storage capabilities.');

		res.json({ success: 'Successfully started migration of user' });

		await client.FileManager.storageManager.migrateUser(client, files, storageId, newProvider);
	};
};