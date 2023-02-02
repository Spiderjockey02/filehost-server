import fs from 'fs';
import PATH from 'path';
import { fileType, fileItem } from './types';
const constants = {
	DIRECTORY: 'directory',
	FILE: 'file',
};


function safeReadDirSync(path: string) {
	let dirData = [];
	try {
		dirData = fs.readdirSync(path);
	} catch(ex: any) {
		if (['EACCES', 'EPERM'].includes(ex.code)) {
			// User does not have permissions, ignore directory
			return null;
		} else {
			throw ex;
		}
	}
	return dirData;
}

function directoryTree(path:string) {
	const name = PATH.basename(path);
	const item = { path, name } as fileItem;
	let stats;
	let lstat;

	try {
		stats = fs.statSync(path);
		lstat = fs.lstatSync(path);
	} catch (e) {
		console.log(e);
		return null;
	}

	if (lstat.isSymbolicLink()) item.isSymbolicLink = true;

	if (stats.isFile()) {
		const ext = PATH.extname(path).toLowerCase();
		// Skip if it does not match the extension regex
		item.size = stats.size;
		item.extension = ext;
		item.type = constants.FILE as fileType;
		item.modified = stats.mtime.getTime();
		if (item.extension == '.url') {
			const filedata = fs.readFileSync(item.path, 'utf8');
			item.url = filedata.split('\n')[1].substring(4, filedata.split('\n')[1].length);
		}

	} else if (stats.isDirectory()) {
		const dirData = safeReadDirSync(path);
		if (dirData === null) return null;

		item.children = dirData
			.map(child => directoryTree(PATH.join(path, child)))
			.filter(e => e !== null || e !== undefined) as fileItem[];

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

function getNumberOfFiles(files: fileItem, num: number) {
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
