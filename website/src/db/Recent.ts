import client from './prisma';

interface UserRecentFilesData {
  id: string
}

export function getUserRecentFiles(data: UserRecentFilesData) {
	return client.recent.findMany({
		where: {
			userId: data.id,
		},
	});
}
