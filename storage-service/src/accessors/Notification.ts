import type { CreateNotification } from '@/types/database/Notification';
import type { Notification } from '@/types/generated/client';
import type { Server } from 'socket.io';
import { LRUCache } from 'lru-cache';
import client from './prisma';

export default class NotificationManager {
	cache: LRUCache<string, Notification>;
	socket: Server;

	constructor(io: Server) {
		this.cache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});
		this.socket = io;
	}

	/**
	  * Creates a new notification
	  * @param {CreateNotification} data The notification data.
	  * @returns {Notification} The created notification.
	*/
	async create(data: CreateNotification): Promise<Notification> {
		const notification = await client.notification.create({
			data: {
				text: data.text,
				title: data.title,
				url: data.url,
				user: {
					connect: {
						id: data.userId,
					},
				},
			},
		});

		// Emit the notification to the user
		this.socket.to(notification.userId).emit('notification', notification);
		this.cache.set(notification.id, notification);
		return notification;
	}


	/**
	  * Retrieves Notifications by Id
	  * @param {string} id The notification id.
	  * @returns {Notification | null} The notification.
	*/
	async getById(id: string): Promise<Notification | null> {
		let notif = this.cache.get(id) ?? null;
		if (notif) return notif;
		notif = await client.notification.findUnique({
			where: { id },
		});
		if (notif) this.cache.set(notif.id, notif);
		return notif;
	}

	/**
	  * Delete a notification by Id
	  * @param {string} id The notification id.
	  * @returns {Boolean} Whether the notification was deleted.
	*/
	async delete(id: string): Promise<boolean> {
		const notif = await client.notification.delete({
			where: { id },
		});
		return this.cache.delete(notif.id);
	}

	/**
	  * Fetch all notifications from a user
	  * @param {string} userId The user id.
	  * @returns {Notification[]} List of user's notifications
	*/
	async getByUserId(userId: string): Promise<Notification[]> {
		return client.notification.findMany({
			where: {
				userId,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}
}
