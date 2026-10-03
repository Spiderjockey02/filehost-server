import { validatePage, validateRecentlyViewed, validateString, validateUpdateUserSettings, validateUserName } from '@/validators';
import { Error, getIP, sanitiseObject } from '@/utils';
import { validateFileIds } from '@/validators/files';
import { authenticatedHandler } from '@/middleware';
import type { AuthenticatedRequest } from '@/types';
import type Client from '@/helpers/Client';
import { avatarForm } from '@/middleware';
import type { Response } from 'express';

// Endpoint: POST /api/session/change-avatar
export const postChangeAvatar = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			// Parse and save file(s)
			const { files } = await avatarForm(client, req, req.session.user);
			if (Object.keys(files).length == 0) throw 'No files uploaded';

			res.json({ success: 'Successfully uploaded user\'s avatar' });
		} catch (err) {
			client.logger.error(err);
			if (typeof err == 'string') return Error.IncorrectQuery(res, [{ message: err }]);
			Error.GenericError(res, `Failed to upload avatar due to: ${err}.`);
		}
		return;
	});
};

// Endpoint: GET /api/session/recently-viewed
export const getRecentlyViewed = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { sortBy, sortOrder, page } = req.query;

			const result = validateRecentlyViewed.safeParse({ sortBy, sortOrder, page });
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const [history, total] = await Promise.all([
				client.recentlyViewedFileManager.fetchUsersRecentlyViewed({ userId: req.session.user.id, ...result.data }),
				client.recentlyViewedFileManager.fetchUsersTotalViewed(req.session.user.id),
			]);

			const historyWithFilePaths = await Promise.all(history.map(async (f) => {
				const path = await client.FileManager.fetchFilePath(f.fileId);
				return { ...f, file: { ...f.file, path } };
			}));

			res.json({ history: sanitiseObject(historyWithFilePaths), total });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch recently viewed files.');
		}
		return;
	});
};

// Endpoint DELETE /api/session/reset-avatar
export const deleteResetAvatar = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			// Delete avatar and send audit log
			await client.FileManager.deleteAvatar(req.session.user.id);
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					resourceType: 'USER',
					eventName: 'USER_AVATAR_CHANGE',
					resourceId: req.session.user.id,
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
					resourceId: req.session.user.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					success: false,
					message: `Failed to reset avatar due to error: ${err}.`,
				});
			});
			Error.GenericError(res, 'Failed to delete user\'s avatar.');
		}
	});
};

// Endpoint GET /api/session/notifications
export const getNotifications = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			const { page } = req.query;
			const result = validatePage.safeParse(page);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			// Fetch notifications from the user
			const [notifications, total] = await Promise.all([
				client.notificationManager.fetchByUserId({ userId: req.session.user.id, page: result.data ?? 0 }),
				client.notificationManager.fetchCount(req.session.user.id),
			]);

			res.json({ notifications: sanitiseObject(notifications), total });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete notification.');
		}
		return;
	});
};

// Endpoint DELETE /api/session/notifications/:id
export const deleteNotification = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		const result = validateString.safeParse(req.params['id']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			// Get the notification from the database and make sure it exists and is owned by the person in session.
			const notification = await client.notificationManager.fetchById(result.data);
			if (!notification) return Error.MissingResource(res);
			if (notification.userId !== req.session.user.id) return Error.InvalidSession(res);

			await client.notificationManager.delete(result.data);
			res.json({ success: 'Successfully deleted notification.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete notification.');
		}
	});
};

// Endpoint GET /api/session/accounts
export const getLinkedAccounts = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			const accounts = await client.userManager.fetchAccountsByUserId(req.session.user.id);
			res.json({ accounts: sanitiseObject(accounts.map(a => ({ id: a.id, provider: a.providerId }))) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch linked accounts.');
		}
	});
};

// Endpoint GET /api/session/list
export const getSessions = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			const sessions = await client.sessionManager.fetchAll(req.session.user.id);
			res.json({ sessions: sanitiseObject(sessions) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch user sessions.');
		}
	});
};

// Endpoint POST /api/session/user
export const postUserInformation = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			const result = validateUserName.safeParse(req.body);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			await client.userManager.update({ name: result.data.name, id: req.session.user.id	});
			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					resourceType: 'USER',
					eventName: 'USER_UPDATE',
					resourceId: req.session.user.id,
					userId: req.session.user.id,
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
					resourceId: req.session.user.id,
					userId: req.session.user.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					message: `Failed to update personal information due to error: ${err}.`,
					success: false,
				});
			});
		}
		return;
	});
};

// Endpoint: GET /api/session/trash
export const getTrash = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			const files = await client.FileManager.fetchOwnedByUserId({ userId:  req.session.user.id, isDeleted: true });
			res.json({ files: sanitiseObject(files) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to retrieve files in trash.');
		}
	});
};

// Endpoint: DELETE /api/session/trash/empty
export const deleteEmpty = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			await client.FileManager.TrashHandler.emptyTrash(req.session.user.id);
			res.json({ success: 'Successfully emptied trash.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to empty trash.');
		}
		return;
	});
};

// Endpoint: PUT /api/session/trash/restore
export const putRestore = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			// Validate request body
			const result = validateFileIds.safeParse(req.body);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			// Loop through each path and restore them (Could take some time if it is multiple deep directories)
			for (const fileId of result.data.fileIds) {
				await client.FileManager.TrashHandler.restoreFile(req.session.user.id, fileId);
			}

			return res.json({ success: 'Successfully restored file ' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to empty trash.');
		}
		return;
	});
};

// Endpoint GET /api/session/gallery
export const getUserGallery = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			const files = await client.FileManager.fetchGalleryByUserId(req.session.user.id);
			res.json({ files: sanitiseObject(files) });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to get user\'s gallery');
		}
	});
};

// Endpoint GET /api/session/config
export const getUserConfig = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			// Get user's settings
			const settings = await client.userManager.fetchConfig(req.session.userId);
			res.json({ plan: sanitiseObject(req.session.user.plan), ...settings });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to get user\'s config');
		}
	});
};

// Endpoint PATCH /api/session/config
export const patchUserConfig = (client: Client) => {
	return authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
		try {
			// Validate request body
			const result = validateUpdateUserSettings.safeParse(req.body);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			// Update user's config
			await client.userManager.updateConfig({ userId: req.session.userId, ...result.data });
			res.json({ success: 'Successfully updated settings' });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to get user\'s config');
		}
	});
};