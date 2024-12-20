import client from './prisma';
import type { IdParam } from '../types';
import { Logger } from '../utils/Logger';

interface usersRecentFilesArgs {
  userId: string
  path: string
}

export async function updateUserRecentFiles(data: usersRecentFilesArgs) {
	Logger.debug(`[DATABASE] Updated recent file list of user: ${data.userId}.`);
	const usersRecents = await client.recent.findMany({
		where: {
			userId: data.userId,
		},
	});

	// First check if the path is already included, if so remove it
	if (usersRecents.find(i => i.location == data.path && i.userId == data.userId)) {
		await updateRecentFile(data);
	} else if (usersRecents.length == 10) {
		const deleteRecent = usersRecents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
		await deleteRecentFileById({ id: deleteRecent.id });
		await addRecentFile(data);
	} else {
		await addRecentFile(data);
	}

	return usersRecents;
}

export async function deleteRecentFileById(data: IdParam) {
	Logger.debug(`[DATABASE] Deleted recent file by id: ${data.id}.`);
	return client.recent.delete({
		where: {
			id: data.id,
		},
	});
}

export async function deleteRecentFileByPath(data: usersRecentFilesArgs) {
	return client.recent.delete({
		where: {
			userId_location: {
				userId: data.userId,
				location: data.path,
			},
		},
	});
}

export async function addRecentFile(data: usersRecentFilesArgs) {
	return client.recent.create({
		data: {
			location: data.path,
			user: {
				connect: {
					id: data.userId,
				},
			},
		},
	});
}

export async function getRecentFilebyPath(data: usersRecentFilesArgs) {
	return client.recent.findUnique({
		where: {
			userId_location: {
				userId: data.userId,
				location: data.path,
			},
		},
	});
}

async function updateRecentFile(data: usersRecentFilesArgs) {
	return client.recent.update({
		data: {
			createdAt: new Date(),
		},
		where: {
			userId_location: {
				location: data.path,
				userId: data.userId,
			},
		},
	});
}
