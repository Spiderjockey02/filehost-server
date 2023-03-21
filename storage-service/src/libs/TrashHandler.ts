import type { DeleteFile } from '@prisma/client';
import { PATHS } from '../utils/CONSTANTS';
import fs from 'fs/promises';
import { Logger } from '../utils/Logger';
import { addDeleteFile, deleteDeleteFile, fetchAllDeleteFiles } from '../db/DeleteFile';
import { getRecentFilebyPath, deleteRecentFileById } from '../db/Recent';

const HOUR_IN_TIME = 60 * 60 * 1000;

export default class TrashHandler {
	public files: Array<DeleteFile>;
	constructor() {
		this.files = [];
		this.init();
		Logger.ready('Trash handler loaded');
	}

	async init() {
		this.files = await fetchAllDeleteFiles();
		setInterval(() => {
			for (const file of this.files) {
				Logger.debug('Checking if files need deleting..');
				if (new Date(file.DeleteFileAt).getTime() <= new Date().getTime()) this.deleteFile(file);
			}
		}, HOUR_IN_TIME);
	}

	/**
	 * Function for deleting file.
	 * @param {string} userId The user Id
	 * @param {string} originalPath The path to the file
	 * @param {string} name The name of the file
	 * @return Promise<void>
	*/
	async addFileToPending(userId: string, originalPath: string, name: string) {
		Logger.debug(`Adding file to pending list: ${name}.`);
		try {
			await fs.mkdir(`${PATHS.TRASH}/${userId}${originalPath}`, { recursive: true });
			await fs.rename(`${PATHS.CONTENT}/${userId}${originalPath}${name}`, `${PATHS.TRASH}/${userId}${originalPath}${name}`);
			const file = await addDeleteFile({ userId, location: `${originalPath}${name}` });
			this.files.push(file);
		} catch (err) {
			Logger.error(JSON.stringify(err));
		}
	}

	/**
	 * Function for deleting file.
	 * @param {DeleteFile} file The file for deleting
	 * @return Promise<void>
	*/
	private async deleteFile(file: DeleteFile) {
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
