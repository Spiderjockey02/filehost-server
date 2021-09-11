const fs = require('fs'),
	PATH = require('path'),
	constants = {
		DIRECTORY: 'directory',
		FILE: 'file',
	};

function safeReadDirSync(path) {
	let dirData = {};
	try {
		dirData = fs.readdirSync(path);
	} catch(ex) {
		if (ex.code == 'EACCES' || ex.code == 'EPERM') {
			// User does not have permissions, ignore directory
			return null;
		} else {
			throw ex;
		}
	}
	return dirData;
}

/**
 * Collects the files and folders for a directory path into an Object, subject
 * to the options supplied, and invoking optional
 * @param  {String} path
 * @param  {function} onEachFile
 * @param  {function} onEachDirectory
 * @return {Object}
 */
function directoryTree(path, onEachFile, onEachDirectory, loops = 0) {
	const name = PATH.basename(path);
	const item = { path, name };
	let stats;
	let lstat;

	try {
		stats = fs.statSync(path);
		lstat = fs.lstatSync(path);
	} catch (e) {
		return null;
	}

	if (lstat.isSymbolicLink()) item.isSymbolicLink = true;

	if (stats.isFile()) {
		const ext = PATH.extname(path).toLowerCase();

		// Skip if it does not match the extension regex
		item.size = stats.size;
		item.extension = ext;
		item.type = constants.FILE;
		item.modified = stats.mtime;
		if (item.extension == '.url') {
			item.url = fs.readFileSync(item.path, 'utf8').substring(24, fs.readFileSync(item.path, 'utf8').length - 4);
		}

		if (onEachFile) {
			onEachFile(item, path, stats);
		}
	} else if (stats.isDirectory()) {
		const dirData = safeReadDirSync(path);
		if (dirData === null) return null;

		if (loops <= 1) {
			item.children = dirData
				.map(child => directoryTree(PATH.join(path, child), onEachFile, onEachDirectory, loops++))
				.filter(e => !!e);
		} else {
			item.children = [];
		}

		item.size = 0;
		item.type = constants.DIRECTORY;
		if (onEachDirectory) {
			onEachDirectory(item, path, stats);
		}
	} else {
		return null;
	}
	return item;
}

module.exports = directoryTree;
