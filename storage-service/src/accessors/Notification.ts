import client from './prisma';

interface CreateNotification {
  text: string
  userId: string
}

export async function createNotification(data: CreateNotification) {
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
