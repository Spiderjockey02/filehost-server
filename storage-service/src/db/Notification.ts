import client from './prisma';
import { Logger } from '../utils/Logger';

interface CreateNotification {
  text: string
  userId: string
}

export async function createNotification(data: CreateNotification) {
	Logger.debug(`[DATABASE] Created new notification for ${data.userId}.`);
	return client.notification.create({
		data: {
			text: data.text,
			user: {
				connect: {
					id: data.userId,
				},
			},
		},
	});
}
