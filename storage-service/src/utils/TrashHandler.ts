import type { deletefile } from '@prisma/client';
import { PATHS } from '../utils/types';
import fs from 'fs/promises';
import { addDeleteFile, deleteDeleteFile, getDeletedFiles } from '../db/DeleteFile';

export default class TrashHandler {
	public files: Array<deletefile>;
	constructor() {
		this.files = [];
		this.init();
	}

	async init() {
		this.files = await getDeletedFiles();
		setInterval(() => {
			for (const file of this.files) {
				if (file.DeleteFileAt <= new Date()) this.deleteFile(file);
			}
		}, 10000);
	}

	async addFile(userId: string, originalPath: string, path: string) {
		try {
			await fs.mkdir(`${PATHS.TRASH}/${userId}${originalPath}`, { recursive: true });
			await fs.rename(`${PATHS.CONTENT}/${userId}${originalPath}${path}`, `${PATHS.TRASH}/${userId}${originalPath}${path}`);
			const file = await addDeleteFile({ userId, location: `${originalPath}${path}` });
			this.files.push(file);
		} catch (err) {
			console.log(err);
		}
	}
	async deleteFile(file: deletefile) {
		try {
			await deleteDeleteFile({ id: file.id });
			await fs.rm(`${PATHS.TRASH}/${file.userId}${file.location}`);
		} catch (err) {
			console.log(err);
		}
	}
}
