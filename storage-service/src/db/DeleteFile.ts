import client from './prisma';
import type { IdParam } from '../types';
import { Logger } from '../utils/Logger';

interface addFileProps {
	userId: string
	location: string
	DeleteFileAt?: Date
}

export async function addDeleteFile(data: addFileProps) {
	Logger.debug(`[DATABASE] Delete file for ${data.location}.`);
	return client.deleteFile.create({
		data: {
			userId: data.userId,
			location: data.location,
			DeleteFileAt: new Date(new Date().setDate(new Date().getDate() + 7)),
		},
	});
}

export async function deleteDeleteFile(data: IdParam) {
	Logger.debug(`[DATABASE] Delete file for ${data.id}.`);
	return client.deleteFile.delete({
		where: {
			id: data.id,
		},
	});
}

export async function fetchAllDeleteFiles() {
	Logger.debug('[DATABASE] Fetch all pending to deleted files.');
	return client.deleteFile.findMany();
}
