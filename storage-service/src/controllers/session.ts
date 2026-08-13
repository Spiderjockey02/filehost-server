import { validatePage, validateRecentlyViewed, validateString } from '@/validators';
import { Error, getIP, sanitiseObject } from '@/utils';
import { avatarForm, getSession } from '@/middleware';
import type { Request, Response } from 'express';
import type Client from '@/helpers/Client';

// Endpoint: POST /api/session/change-avatar
export const postChangeAvatar = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// Parse and save file(s)
			const { files } = await avatarForm(client, req, session.user);
			if (Object.keys(files).length == 0) throw 'No files uploaded';

			res.json({ success: 'Successfully uploaded user\'s avatar' });
		} catch (err) {
			client.logger.error(err);
			if (typeof err == 'string') return Error.IncorrectQuery(res, [{ message: err }]);
			Error.GenericError(res, `Failed to upload avatar due to: ${err}.`);
		}
	};
};

// Endpoint: GET /api/session/recently-viewed
export const getRecentlyViewed = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);
			const { sortBy, sortOrder, page } = req.query;

			const result = validateRecentlyViewed.safeParse({ sortBy, sortOrder, page });
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const [files, total] = await Promise.all([
				client.recentlyViewedFileManager.fetchUsersRecentlyViewed({ userId: session.user.id, ...result.data }),
				client.recentlyViewedFileManager.fetchUsersTotalViewed(session.user.id),
			]);

			res.json({ files: sanitiseObject(files), total });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch recently viewed files.');
		}
	};
};

// Endpoint DELETE /api/session/reset-avatar
export const deleteResetAvatar = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		try {
			// Delete avatar and send audit log
			await client.FileManager.deleteAvatar(session.user.id);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					resourceType: 'USER',
					eventName: 'USER_AVATAR_CHANGE',
					resourceId: session.user.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					success: true,
					message: 'Successfully reset avatar.',
				});
			});

			res.json({ success: 'Successfully deleted avatar' });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					resourceType: 'USER',
					eventName: 'USER_AVATAR_CHANGE',
					resourceId: session.user.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					success: false,
					message: `Failed to reset avatar due to error: ${err}.`,
				});
			});
			Error.GenericError(res, 'Failed to delete user\'s avatar.');
		}
	};
};

// Endpoint GET /api/session/notifications
export const getNotifications = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);
			const { page } = req.query;
			const result = validatePage.safeParse(page);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			// Fetch notifications from the user
			const [notifications, total] = await Promise.all([
				client.notificationManager.fetchByUserId({ userId: session.user.id, page: result.data ?? 0 }),
				client.notificationManager.fetchCount(session.user.id),
			]);

			res.json({ notifications: sanitiseObject(notifications), total });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete notification.');
		}
	};
};

// Endpoint DELETE /api/session/notifications/:id
export const deleteNotification = (client: Client) => {
	return async (req: Request, res: Response) => {
		const result = validateString.safeParse(req.params['id']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// Get the notification from the database and make sure it exists and is owned by the person in session.
			const notification = await client.notificationManager.fetchById(result.data);
			if (!notification) return Error.MissingResource(res);
			if (notification.userId !== session.user.id) return Error.InvalidSession(res);

			await client.notificationManager.delete(result.data);
			res.json({ success: 'Successfully deleted notification.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete notification.');
		}
	};
};

// Endpoint GET /api/session/accounts
export const getLinkedAccounts = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);
			const accounts = await client.userManager.fetchAccountsByUserId(session.user.id);

			res.json({ accounts: sanitiseObject(accounts.map(a => ({ id: a.id, provider: a.providerId }))) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch linked accounts.');
		}
	};
};

// Endpoint GET /api/session/list
export const getSessions = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			const sessions = await client.sessionManager.fetchAll(session.user.id);
			res.json({ sessions: sanitiseObject(sessions) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch user sessions.');
		}
	};
};

// Endpoint POST /api/session/user
export const postUserInformation = (client: Client) => {
	return async (req: Request, res: Response) => {
		const session = await getSession(client, req.headers);
		if (!session?.user) return Error.InvalidSession(res);

		try {
			const result = validateString.safeParse(req.body['name']);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			await client.userManager.update({ name: result.data, id: session.user.id	});
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					resourceType: 'USER',
					eventName: 'USER_UPDATE',
					resourceId: session.user.id,
					userId: session.user.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					message: 'Successfully updated user\'s personal information.',
					success: true,
				});
			});

			res.json({ success: 'Successfully updated user\'s information' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to update user information.');

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					resourceType: 'USER',
					eventName: 'USER_UPDATE',
					resourceId: session.user.id,
					userId: session.user.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					message: `Failed to update personal information due to error: ${err}.`,
					success: false,
				});
			});
		}
	};
};

// Endpoint: GET /api/session/trash
export const getTrash = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			const files = await client.FileManager.fetchOwnedByUserId({ userId:  session.user.id, isDeleted: true });
			res.json({ files: sanitiseObject(files) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to retrieve files in trash.');
		}
	};
};


// Endpoint: DELETE /api/session/trash/empty
export const deleteEmpty = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			await client.FileManager.TrashHandler.emptyTrash(session.user.id);
			res.json({ success: 'Successfully emptied trash.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to empty trash.');
		}
	};
};

// Endpoint: PUT /api/session/trash/restore
export const putRestore = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// Get and validate the file paths for restoring
			const { fileIds } = req.body;
			if (!Array.isArray(fileIds) || fileIds.length == 0) return Error.IncorrectQuery(res, [{ message: 'File paths are missing from request' }]);

			// Loop through each path and restore them (Could take some time if it is multiple deep directories)
			for (const fileId of fileIds) {
				await client.FileManager.TrashHandler.restoreFile(session.user.id, fileId);
			}

			res.json({ success: 'Successfully restored file ' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to empty trash.');
		}
	};
};

// Endpoint GET /api/session/gallery
export const getUserGallery = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			const files = await client.FileManager.fetchGalleryByUserId(session.user.id);
			res.json({ files: sanitiseObject(files) });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to get user\'s gallery');
		}
	};
};