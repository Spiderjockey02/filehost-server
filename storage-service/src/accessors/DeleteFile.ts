import client from './prisma';
import type { IdParam } from '../types';

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

export async function deleteDeleteFile(data: IdParam) {
	return client.deleteFile.delete({
		where: {
			id: data.id,
		},
	});
}

export async function fetchAllDeleteFiles() {
	return client.deleteFile.findMany();
}
