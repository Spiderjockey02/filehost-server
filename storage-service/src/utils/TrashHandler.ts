import type { deletefile } from '@prisma/client';
import { PATHS } from '../utils/types';
import fs from 'fs/promises';
import { Logger } from '../utils/Logger';
import { addDeleteFile, deleteDeleteFile, getDeletedFiles } from '../db/DeleteFile';
import { getRecentFilebyPath, deleteRecentFileById } from '../db/Recent';

const HOUR_IN_TIME = 60 * 60 * 1000;

export default class TrashHandler {
	public files: Array<deletefile>;
	constructor() {
		this.files = [];
		this.init();
		Logger.ready('Trash handler loaded');
	}

	async init() {
		this.files = await getDeletedFiles();
		setInterval(() => {
			for (const file of this.files) {
				Logger.debug('Checking if files need deleting..');
				if (new Date(file.DeleteFileAt).getTime() <= new Date().getTime()) this.deleteFile(file);
			}
		}, HOUR_IN_TIME);
	}

	async addFile(userId: string, originalPath: string, path: string) {
		Logger.debug(`Adding file: ${path}.`);
		try {
			await fs.mkdir(`${PATHS.TRASH}/${userId}${originalPath}`, { recursive: true });
			await fs.rename(`${PATHS.CONTENT}/${userId}${originalPath}${path}`, `${PATHS.TRASH}/${userId}${originalPath}${path}`);
			const file = await addDeleteFile({ userId, location: `${originalPath}${path}` });
			this.files.push(file);
		} catch (err) {
			Logger.error(JSON.stringify(err));
		}
	}
	async deleteFile(file: deletefile) {
		Logger.debug(`Deleting file: ${file.location}.`);
		try {
			const recentFile = await getRecentFilebyPath({ userId: file.userId, path: `/${file.location}` });
			if (recentFile) await deleteRecentFileById({ id: recentFile.id });
			await deleteDeleteFile({ id: file.id });
			await fs.rm(`${PATHS.TRASH}/${file.userId}${file.location}`);
			// remove from cache
			const index = this.files.indexOf(file);
			if (index > -1) this.files.splice(index, 1);
		} catch (err) {
			Logger.error(JSON.stringify(err));
		}
	}
}
