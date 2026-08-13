import { validateMigrateUser, validateUpdateStorage } from '@/validators/endpointParams';
import { validatePage, validateStorage, validateString } from '@/validators';
import { Error, getIP, sanitiseObject } from '@/utils';
import type { Request, Response } from 'express';
import type Client from '@/helpers/Client';
import { getSession } from '@/middleware';

// Endpoint: GET /api/admin/storage
export const getStorages = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const result = validatePage.safeParse(req.query['page']);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const [avgStorageUsage, avgFileCount, storages] = await Promise.all([
				client.FileManager.storageManager.fetchAvgStorageUsage(),
				client.FileManager.storageManager.fetchAvgFileCount(),
				client.FileManager.storageManager.fetchAll({ page: result.data }),
			]);

			res.json({ storages: sanitiseObject(storages), avgFileCount, avgStorageUsage });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch storage mediums.');
		}
	};
};

// Endpoint: GET /api/admin/storage/:storageId
export const getStorageById = (client: Client) => {
	return async (req: Request, res: Response) => {
		const result = validateString.safeParse(req.query['storageId']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			const storage = await client.FileManager.storageManager.fetchById(result.data);
			if (!storage) return Error.MissingResource(res);

			res.json({ storage: sanitiseObject(storage) });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch storage medium.');
		}
	};
};

// Endpoint: DELETE /api/admin/storage/:storageId
export const deleteStorageById = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);

		const result = validateString.safeParse(req.query['storageId']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			const storage = await client.FileManager.storageManager.fetchById(result.data);
			if (storage == null) return Error.MissingResource(res);

			// Ensure no users or files are attached to this before deleting
			if (storage._count.files > 0 || storage._count.users > 0) return Error.GenericError(res, 'Storage is not empty');
			await client.FileManager.storageManager.delete(storage.id);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'STORAGE',
					eventName: 'STORAGE_DELETED',
					message: 'Successfully deleted storage medium.',
					resourceId: storage.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});

			res.json({ success: 'Successfully deleted storage.' });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'STORAGE',
					eventName: 'STORAGE_DELETED',
					message: `Failed to delete storage medium due to error: ${err}.`,
					resourceId: result.data,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			return Error.GenericError(res, 'Failed to delete storage medium.');
		}
	};
};


// Endpoint: POST /api/admin/storage
export const postStorage = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);

		const result = validateStorage.safeParse(req.body);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			const storage = await client.FileManager.storageManager.create({
				...result.data,
				maxSize: BigInt(Number(result.data.maxSize) * (1024 ** 3)),
			});

			const medium = await client.FileManager.storageManager.getProvider(storage);
			await medium.verifyConnection();

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'STORAGE',
					eventName: 'STORAGE_CREATED',
					message: 'Successfully created Storage medium.',
					resourceId: storage.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully created new storage medium.', storage: sanitiseObject(storage) });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'STORAGE',
					eventName: 'STORAGE_CREATED',
					message: `Failed to create storage medium due to error: ${err}.`,
					resourceId: '',
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
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
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch storage mediums.');
		}
	};
};

// Endpoint: POST /api/admin/storage/:storageId
export const postStorageByStorageId = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);

		const storageResult = validateString.safeParse(req.query['storageId']);
		if (!storageResult.success) return Error.IncorrectQuery(res, storageResult.error.issues);

		try {
			const bodyResult = validateUpdateStorage.safeParse(req.body);
			if (!bodyResult.success) return Error.IncorrectQuery(res, bodyResult.error.issues);

			// Fetch storage to ensure new maxSize does not exceed current usage
			const storage = await client.FileManager.storageManager.fetchById(storageResult.data);
			if (!storage) return Error.MissingResource(res);

			const newMaxSize = Number(bodyResult.data.maxSize) * (1024 ** 3);
			if (newMaxSize < storage.usedSize) return Error.IncorrectQuery(res, [{ message: 'maxSize must be greater than current usage.' }]);

			// Update storage
			const newStorage = await client.FileManager.storageManager.update({
				id: storageResult.data,
				name: bodyResult.data.name,
				maxSize: BigInt(newMaxSize),
				isPrivate: bodyResult.data.isPrivate,
			});

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'STORAGE',
					eventName: 'STORAGE_UPDATED',
					message: 'Successfully updated storage medium.',
					resourceId: storage.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: true,
				});
			});
			res.json({ success: 'Successfully updated storage.', storage: sanitiseObject(newStorage) });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					userId: session?.user.id,
					resourceType: 'STORAGE',
					eventName: 'STORAGE_UPDATED',
					message: `Failed to update storage medium: ${err}.`,
					resourceId: storageResult.data,
					ip: getIP(req),
					userAgent: req.headers['user-agent'] ?? '',
					success: false,
				});
			});
			return Error.GenericError(res, 'Failed to update storage.');
		}
	};
};

// Endpoint: POST /api/admin/storage/:storageId/migrate
export const postMigrateUserFromStorage = (client: Client) => {
	return async (req: Request, res: Response) => {
		const result = validateMigrateUser.safeParse({ storageId: req.params['storageId'], userId: req.query['userId'] });
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);


		// Fetch all user's files
		const files = await client.FileManager.fetchOwnedByUserId({ userId: result.data.userId });
		await client.userManager.update({ id: result.data.userId, isMigrating: true });

		const storage = await client.FileManager.storageManager.fetchById(result.data.storageId);
		if (storage == null) return Error.GenericError(res, 'storageId is invalid');

		const newProvider = await client.FileManager.storageManager.getProviderById(result.data.storageId);
		const isProviderOnline = await newProvider.verifyConnection();
		if (!isProviderOnline) return Error.GenericError(res, 'Storage medium is not online');

		// Make sure that if the all the files moved it won't go over the new storage medium usage limit
		const totalFileSize = files.reduce((a, b) => a + b.size, 0n);
		if (storage.usedSize + totalFileSize > storage.maxSize) return Error.GenericError(res, 'Total files exceed storage capabilities.');

		res.json({ success: 'Successfully started migration of user' });

		await client.FileManager.storageManager.migrateUser(client, files, result.data.storageId, newProvider);
	};
};