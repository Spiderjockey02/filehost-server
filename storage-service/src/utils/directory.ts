import fs from 'fs/promises';
import PATH from 'path';
import type { fileType, fileItem } from '../types';
const constants = {
	DIRECTORY: 'directory',
	FILE: 'file',
};

async function safeReadDirSync(path: string) {
	let dirData = [];
	try {
		dirData = await fs.readdir(path);
	} catch {
		return null;
	}
	return dirData;
}

async function directoryTree(path: string, depth = 1) {
	const name = PATH.basename(path);
	const item = { path, name } as fileItem;
	let stats;

	try {
		stats = await fs.stat(path);
	} catch (e) {
		return null;
	}

	if (stats.isFile()) {
		const ext = PATH.extname(path).toLowerCase();
		// Skip if it does not match the extension regex
		item.size = stats.size;
		item.extension = ext;
		item.type = constants.FILE as fileType;
		item.modified = stats.mtime.getTime();

	} else if (stats.isDirectory()) {
		const dirData = await safeReadDirSync(path);
		if (dirData === null) return null;
		item.children = [];

		if (depth >= 0) {
			const children = await Promise.all(dirData
				.map(async (child) => await directoryTree(PATH.join(path, child), depth - 1)));
			item.children = children.filter(e => e !== null || e !== undefined) as fileItem[];

			// Get time modified for folder
			if (item.children.length == 0) {
				item.modified = new Date(stats.birthtime).getTime();
			} else {
				const folderModifed = item.children.sort((a, b) => {
					if (a === null) return 0;
					if (b === null) return 0;
					if ((new Date(a.modified).getTime() ?? 0) > (new Date(b.modified).getTime() ?? 0)) return 1;
					return -1;
				})[0];

				if (folderModifed !== null || folderModifed !== undefined) item.modified = folderModifed?.modified ?? new Date().getTime();
			}
		}

		// Get total size of folder
		const folderSize = getNumberOfFiles(item, 0);
		item.size = folderSize;
		item.type = constants.DIRECTORY as fileType;
	} else {
		return null;
	}
	return item;
}

export default directoryTree;

export function getNumberOfFiles(files: fileItem | null, num: number) {
	if (files == null) return 0;
	for (const file of files.children) {
		if (file === null) return num += 0;
		if (file.type == 'directory') {
			num = getNumberOfFiles(file, num);
		} else {
			num += file.size;
		}
	}
	return num;
}
