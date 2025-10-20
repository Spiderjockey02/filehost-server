import { avatarForm, getSession } from '../middleware';
import type { Request, Response } from 'express';
import { Error, getIP, sanitiseObject } from '../utils';
import type Client from '../helpers/Client';

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
			if (typeof err == 'string') return Error.IncorrectQuery(res, err);
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

			const files = await client.recentlyViewedFileManager.fetchUserLatest(session.user.id);
			res.json({ files: sanitiseObject(files) });
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
					eventType: 'USER_AVATAR_CHANGE',
					resourceId: session.user.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					success: true,
					message: 'User reset their avatar',
				});
			});

			res.json({ success: 'Successfully deleted avatar' });
		} catch (err) {
			client.logger.error(err);

			client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
				await client.AuditLogManager.create({
					resourceType: 'USER',
					eventType: 'USER_AVATAR_CHANGE',
					resourceId: session.user.id,
					ip: getIP(req),
					userAgent: req.headers['user-agent'],
					success: true,
					message: `Failed to reset avatar: ${err}`,
				});
			});
			Error.GenericError(res, 'Failed to delete user\'s avatar.');
		}
	};
};

// Endpoint DELETE /api/session/notifications/:id
export const deleteNotification = (client: Client) => {
	return async (req: Request, res: Response) => {
		const notifId = req.params.id;

		try {
			const session = await getSession(client, req.headers);
			if (!session?.user) return Error.InvalidSession(res);

			// Get the notification from the database and make sure it exists and is owned by the person in session.
			const notification = await client.notificationManager.getById(notifId);
			if (!notification) return Error.IncorrectQuery(res, 'Notification not found.');
			if (notification.userId !== session.user.id) return Error.InvalidSession(res);

			await client.notificationManager.delete(notifId);
			res.json({ success: 'Successfully deleted notification.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete user\'s avatar.');
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