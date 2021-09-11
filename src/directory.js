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
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 * @param  {string} path
 * @return {string}
 */
function normalizePath(path) {
	return path.replace(/\\/g, '/');
}

/**
 * Tests if the supplied parameter is of type RegExp
 * @param  {any}  regExp
 * @return {Boolean}
 */
function isRegExp(regExp) {
	return typeof regExp === 'object' && regExp.constructor == RegExp;
}

/**
 * Collects the files and folders for a directory path into an Object, subject
 * to the options supplied, and invoking optional
 * @param  {String} path
 * @param  {Object} options
 * @param  {function} onEachFile
 * @param  {function} onEachDirectory
 * @return {Object}
 */
function directoryTree(path, options, onEachFile, onEachDirectory, loops = 0) {
	const name = PATH.basename(path);
	options = options || {};
	path = options.normalizePath ? normalizePath(path) : path;
	const item = { path, name };
	let stats;
	let lstat;

	try {
		stats = fs.statSync(path);
		lstat = fs.lstatSync(path);
	} catch (e) {
		return null;
	}

	// Skip if it matches the exclude regex
	if (options.exclude) {
		const excludes = isRegExp(options.exclude) ? [options.exclude] : options.exclude;
		if (excludes.some((exclusion) => exclusion.test(path))) return null;
	}

	if (lstat.isSymbolicLink()) {
		item.isSymbolicLink = true;
		// Skip if symbolic links should not be followed
		if (options.followSymlinks === false) return null;
		// Initialize the symbolic links array to avoid infinite loops
		if (!options.symlinks) options = { ...options, symlinks: [] };
		// Skip if a cyclic symbolic link has been found
		if (options.symlinks.find(ino => ino === lstat.ino)) {
			return null;
		} else {
			options.symlinks.push(lstat.ino);
		}
	}

	if (stats.isFile()) {
		const ext = PATH.extname(path).toLowerCase();

		// Skip if it does not match the extension regex
		if (options.extensions && !options.extensions.test(ext)) return null;
		item.size = stats.size;
		item.extension = ext;
		item.type = constants.FILE;
		item.modified = stats.mtime;
		if (item.extension == '.url') {
			item.url = fs.readFileSync(item.path, 'utf8').substring(24, fs.readFileSync(item.path, 'utf8').length - 4);
		}

		if (options.attributes) {
			options.attributes.forEach((attribute) => {
				item[attribute] = stats[attribute];
			});
		}

		if (onEachFile) {
			onEachFile(item, path, stats);
		}
	} else if (stats.isDirectory()) {
		const dirData = safeReadDirSync(path);
		if (dirData === null) return null;

		if (options.attributes) {
			options.attributes.forEach((attribute) => {
				item[attribute] = stats[attribute];
			});
		}

		if (loops <= 1) {
			item.children = dirData
				.map(child => directoryTree(PATH.join(path, child), options, onEachFile, onEachDirectory, loops++))
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
