import { Request, Response } from 'express';
import { avatarForm, getSession } from '../middleware';
import { Error, sanitiseObject } from '../utils';
import { Client } from 'src/helpers';

// Endpoint: POST /api/session/change-avatar
export const postChangeAvatar = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			// Parse and save file(s)
			await avatarForm(req, session.user.id);
			return res
				.json({ success: 'Successfully uploaded user\'s avatar' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to upload file.');
		}
	};
};

// Endpoint: GET /api/session/recently-viewed
export const getRecentlyViewed = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
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
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			await client.FileManager.deleteAvatar(session.user.id);
			res.json({ success: 'Successfully deleted avatar' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to delete user\'s avatar.');
		}
	};
};

// Endpoint DELETE /api/session/notifications/:id
export const deleteNotification = (client: Client) => {
	return async (req: Request, res: Response) => {
		const notifId = req.params.id;

		try {
			const session = await getSession(req);
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