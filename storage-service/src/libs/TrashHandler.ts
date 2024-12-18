import type { DeleteFile } from '@prisma/client';
import { PATHS } from '../utils';
import fs from 'fs/promises';
import { addDeleteFile, deleteDeleteFile, fetchAllDeleteFiles } from '../accessors/DeleteFile';
import { getRecentFilebyPath, deleteRecentFileById } from '../accessors/Recent';
const HOUR_IN_TIME = 60 * 60 * 1000;

export default class TrashHandler {
	public files: Array<DeleteFile>;
	constructor() {
		this.files = [];
		this.init();
	}

	async init() {
		this.files = await fetchAllDeleteFiles();
		setInterval(() => {
			for (const file of this.files) {
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
		try {
			await fs.mkdir(`${PATHS.TRASH}/${userId}${originalPath}`, { recursive: true });
			await fs.rename(`${PATHS.CONTENT}/${userId}${originalPath}${name}`, `${PATHS.TRASH}/${userId}${originalPath}${name}`);
			const file = await addDeleteFile({ userId, location: `${originalPath}${name}` });
			this.files.push(file);
		} catch (err) {
			console.log(err);
		}
	}

	/**
	 * Function for deleting file.
	 * @param {DeleteFile} file The file for deleting
	 * @return Promise<void>
	*/
	private async deleteFile(file: DeleteFile) {
		try {
			const recentFile = await getRecentFilebyPath({ userId: file.userId, path: `/${file.location}` });
			if (recentFile) await deleteRecentFileById({ id: recentFile.id });
			await deleteDeleteFile({ id: file.id });
			await fs.rm(`${PATHS.TRASH}/${file.userId}${file.location}`);

			// remove from cache
			const index = this.files.indexOf(file);
			if (index > -1) this.files.splice(index, 1);
		} catch (err) {
			console.log(err);
		}
	}
}
