import client from './prisma';

interface usersRecentFilesArgs {
  id: string
  path: string
}

export async function updateUserRecentFiles(data: usersRecentFilesArgs) {
	const usersRecents = await client.recent.findMany({
		where: {
			userId: data.id,
		},
	});

	// First check if the path is already included, if so remove it
	if (usersRecents.find(i => i.location == data.path && i.userId == data.id)) {
		await updateRecentFile(data);
	} else if (usersRecents.length == 10) {
		const deleteRecent = usersRecents.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())[0];
		await deleteRecentFile({ id: deleteRecent.id });
		await addRecentFile(data);
	} else {
		await addRecentFile(data);
	}


	return usersRecents;
}

interface deleteRecentFileArgs {
  id: string
}

export async function deleteRecentFile(data: deleteRecentFileArgs) {
	return client.recent.delete({
		where: {
			id: data.id,
		},
	});
}

export function addRecentFile(data: usersRecentFilesArgs) {
	return client.recent.create({
		data: {
			location: data.path,
			user: {
				connect: {
					id: data.id,
				},
			},
		},
	});
}

export async function updateRecentFile(data: usersRecentFilesArgs) {
	return client.recent.update({
		data: {
			created_at: new Date(),
		},
		where: {
			userId_location: {
				location: data.path,
				userId: data.id,
			},
		},
	});
}
