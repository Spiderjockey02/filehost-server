import client from './prisma';

interface addFileProps {
	userId: string
	location: string
	DeleteFileAt?: Date
}

export async function addDeleteFile(data: addFileProps) {
	return client.deleteFile.create({
		data: {
			userId: data.userId,
			location: data.location,
			DeleteFileAt: new Date(new Date().setDate(new Date().getDate() + 7)),
		},
	});
}

interface deleteFileProps {
	id: string
}

export async function deleteDeleteFile(data: deleteFileProps) {
	return client.deleteFile.delete({
		where: {
			id: data.id,
		},
	});
}

export async function getDeletedFiles() {
	return client.deleteFile.findMany();
}
