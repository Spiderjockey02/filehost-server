const express = require('express'),
	router = express.Router(),
	{ logger, dirTree } = require('../../utils'),
	{ ensureAuthenticated } = require('../config/auth'),
	{ UserSchema } = require('../../models'),
	fs = require('fs'),
	fresh = require('fresh'),
	{ IncomingForm } = require('formidable'),
	stringSimilarity = require('string-similarity'),
	location = process.cwd() + '/src/website/files/';

// search for item
function SearchHG(tree, value, path = tree.name) {
	const foundItems = [];
	for (const child of tree.children) {
		if (child.type == 'directory') {
			const newItems = SearchHG(child, value, `${path}/${child.name}`);
			if (newItems[0]) foundItems.push(...newItems);
		}
		const output = stringSimilarity.compareTwoStrings(value, child.name);
		if (output > 0.60) foundItems.push(`${path}/${child.name}`);
	}
	return foundItems;
}

// Show file explorer
router.get('/*', ensureAuthenticated, async (req, res) => {
	// User is searching for file
	if (req.query.search) {
		const { search, fileType, dateUpdated } = req.query;
		const tree = dirTree(decodeURI(location + req.user._id));
		let files = SearchHG(tree, search);
		// Filter out files/folders
		if (fileType && fileType !== 0) {
			files = files.filter(item => {
				const stats = fs.statSync(location + item);
				if (fileType == 1) {
					if (stats.isFile()) return true;
					return false;
				} else if (fileType == 2) {
					if (stats.isFile()) return false;
					return true;
				}
				return true;
			});
		}

		// Filter out my date updated
		if (dateUpdated && dateUpdated !== 0) {
			files = files.filter(item => {
				const fileTime = fs.statSync(location + item).mtime.getTime();
				// day, week, month, year
				if (dateUpdated == 1) {
					if (fileTime >= (new Date().getTime() - 86400000)) return true;
					return false;
				}
				if (dateUpdated == 2) {
					if (fileTime >= (new Date().getTime() - 7 * 86400000)) return true;
					return false;
				}
				if (dateUpdated == 3) {
					if (fileTime >= (new Date().getTime() - 30 * 86400000)) return true;
					return false;
				}
				if (dateUpdated == 4) {
					if (fileTime >= (new Date().getTime() - 365 * 86400000)) return true;
					return false;
				}
				return true;
			});
		}
		return res.render('user/search', {
			user: req.isAuthenticated() ? req.user : null,
			query: req.query.search,
			formatBytes: require('../../utils').formatBytes,
			files: files.map(file => Object.assign(dirTree(decodeURI(location + file)), { url: file })),
		});
	}

	const URLpath = req._parsedOriginalUrl.pathname,
		user = req.user,
		path = decodeURI(location + req.user._id + URLpath.substring(6, URLpath.length));

	// Check if file path exists
	if (fs.existsSync(path)) {
		// Now check if file is a folder or file
		const files = dirTree(path);
		if (files.type == 'file') {
			// update recently viewed files
			try {
				if (user.recent.length >= 10) user.recent.shift();
				if (!user.recent.some((file) => file.path == URLpath.substring(6, URLpath.length))) {
					files.path = URLpath.substring(6, URLpath.length);
					user.recent = [...user.recent, files];
					await UserSchema.findOneAndUpdate({ _id: req.user._id }, { recent: user.recent });
				}
			} catch (err) {
				logger.log(err.message, 'error');
			}

			// Read file from cached
			if (isFresh(req, res)) {
				res.statusCode = 304;
				return res.end();
			}
			// new file
			res.render('user/file-preview', {
				user: req.isAuthenticated() ? req.user : null,
				fileInfo: Object.assign(files, { mimeType: require('mime-types').lookup(files.extension) }),
				file: req.user._id + URLpath.substring(6, URLpath.length),
				domain: require('../../config').domain,
			});
		} else {
			res.render('user/files', {
				user: req.isAuthenticated() ? req.user : null,
				files: files,
				path: (URLpath == '/files' ? '/' : URLpath),
				error: req.query.error,
				formatBytes: require('../../utils').formatBytes,
				getFileIcon: require('../../utils').getFileIcon,
			});
		}
	} else {
		res.send('No files found');
	}
});


// upload files to user's account
router.post('/upload', ensureAuthenticated, async (req, res) => {
	const form = new IncomingForm({ multiples: true, allowEmptyFiles: false, maxFieldsSize: require('../../config').uploadLimit, uploadDir: location });
	// File has been uploaded (create folders if neccessary)
	form.on('file', function(field, file) {
		if (!file.name) return;
		const name = file.name.split('/');
		name.pop();
		for (const folder of name) {
			const newPath = name.splice(name.indexOf(folder));
			if (folder !== name[name.length - 1]) {
				const items = [];
				newPath.forEach((item) => {
					items.push(item);
					if (!fs.existsSync(location + req.user._id + `/${items.join('/')}`)) {
						fs.mkdirSync(location + req.user._id + `/${items.join('/')}`);
					}
				});
			}
		}


		// Move item to new area
		fs.rename(file.path, `${location + req.user._id}/${file.name}`, function(err) {
			if (err) throw err;
		});
	});

	// log any errors that occur
	form.on('error', function(err) {
		res.redirect(`/files?error=${err}`);
	});

	// parse the incoming request containing the form data
	form.parse(req);
});

// delete file/folder
router.post('/delete', ensureAuthenticated, async (req, res) => {
	// how big is the file that they are deleting
	const p = fs.statSync(location + req.user._id + req.body.path);
	try {
		// update user's total size
		await UserSchema.findOneAndUpdate({ _id: req.user._id }, { size: Number(req.user.size ?? 0) - p.size });
		// delete file
		if (p.isFile()) {
			await fs.unlinkSync(location + req.user._id + req.body.path);
		} else {
			await fs.rmdirSync(location + req.user._id + req.body.path, { recursive: true });
		}
		res.redirect('/files');
	} catch (err) {
		console.log(err);
		res.redirect(`/files?error=${err.message}`);
	}
});

router.post('/share', ensureAuthenticated, async (req, res) => {
	try {
		const user = await UserSchema.findOne({ _id: req.user._id });
		let link = randomStr(20, '12345abcde');

		// Make sure item isn't already being shared
		if (user.shared.find(item => item.path == req.body.path)) {
			return res.redirect('/files?error=Item is already being shared');
		}

		// Make sure no duplicate share links
		while (user.shared.find(item => item.id == link)) {
			link = randomStr(20, '12345abcde');
		}

		user.shared.push({ id: link, path: req.body.path });
		await user.save();
	} catch (err) {
		console.log(err);
	}
});

router.post('/search', ensureAuthenticated, (req, res) => {
	console.log(req.body);
	res.redirect(`/files?search=${req.body.search}&fileType=${req.body.fileType}&dateUpdated=${req.body.dateUpdated}`);
});
module.exports = router;

// Caching
function isFresh(req, res) {
	return fresh(req.headers, {
		'etag': res.getHeader('ETag'),
		'last-modified': res.getHeader('Last-Modified'),
	});
}

// Create random alphanumerical string
function randomStr(len, arr) {
	let ans = '';
	for (let i = len; i > 0; i--) {
		ans += arr[Math.floor(Math.random() * arr.length)];
	}
	return ans;
}
