const express = require('express'),
	router = express.Router(),
	{ logger, dirTree, isFresh } = require('../../utils'),
	{ ensureAuthenticated } = require('../config/auth'),
	{ UserSchema } = require('../../models'),
	fs = require('fs'),
	formidable = require('formidable'),
	stringSimilarity = require('string-similarity'),
	location = process.cwd() + '/src/website/files/userContent/';

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

function createSearchList(tree) {
	const foundItems = [];
	if (tree.type == 'directory') {
		for (const child of tree.children) {
			if (child.type == 'directory') {
				foundItems.push(...createSearchList(child));
			} else {
				foundItems.push(child.name);
			}
		}
	} else {
		foundItems.push(tree.name);
	}

	return foundItems;
}

router.get('/search', ensureAuthenticated, (req, res) => {
	// User is searching for file
	if (req.query.query) {
		const { query, fileType, dateUpdated } = req.query;
		const tree = dirTree(decodeURI(location + req.user._id));
		let files = SearchHG(tree, query);
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
			user: req.user,
			query: req.query.query,
			files: files.map(file => Object.assign(dirTree(decodeURI(location + file)), { url: file })),
			...require('../../utils'),
		});
	}
});

// Show file explorer
router.get('/*', ensureAuthenticated, async (req, res) => {
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
			if (isFresh(req, res)) return res.status(304).end();

			// new file
			res.render('user/file-preview', {
				user: req.user,
				fileInfo: Object.assign(files, { mimeType: require('mime-types').lookup(files.extension) }),
				file: req.user._id + URLpath.substring(6, URLpath.length),
				domain: require('../../config').domain,
			});
		} else {
			const totalPages = Math.ceil(files.children.length / 50) - 1;
			if (files.children.filter(item => {
				if (item.type == 'directory') return false;
				return ['video', 'image'].includes(require('mime-types').lookup(item.extension).split('/')[0]);
			}).length / files.children.length >= 0.60) {
				if (req.query.page < 0) return res.redirect(`${req._parsedOriginalUrl.pathname}?page=1`);
				if (req.query.page > totalPages) return res.redirect(`${req._parsedOriginalUrl.pathname}?page=${totalPages}`);
				let page = req.query.page >= totalPages ? totalPages : Number(req.query.page ?? 0);
				page = req.query.page < 0 ? 0 : page;
				console.log(`Page: ${page}`);
				files.children = files.children.slice(page * 50, (page + 1) * 50);
			}
			console.log(files);
			res.render('user/files', {
				user: req.user,
				path: (URLpath == '/files' ? '/' : URLpath),
				error: req.flash('error'),
				success: req.flash('success'),
				currentPage: req.query.page ?? 1,
				maxPage: totalPages,
				searchList: createSearchList(files),
				...require('../../utils'), files,
			});
		}
	} else {
		res.send('No files found');
	}
});


// upload files to user's account
router.post('/upload', ensureAuthenticated, async (req, res) => {
	const form = formidable({
		multiples: true,
		allowEmptyFiles: false,
		maxFileSize: require('../../config').uploadLimit,
		maxFieldsSize: require('../../config').uploadLimit,
		uploadDir: location });

	// File has been uploaded (create folders if neccessary)
	form.on('file', async function(field, file) {
		if (!file.originalFilename) return;
		const name = file.originalFilename.split('/');
		name.pop();
		for (const folder of name) {
			const newPath = name.splice(name.indexOf(folder));
			if (folder !== name[name.length - 1]) {
				const items = [];
				newPath.forEach((item) => {
					items.push(item);
					console.log(location + req.user._id + `/${items.join('/')}`);
					if (!fs.existsSync(location + req.user._id + `/${items.join('/')}`)) {
						fs.mkdirSync(location + req.user._id + `/${items.join('/')}`);
					}
				});
			}
		}

		// Move item to new area
		await UserSchema.findOneAndUpdate({ _id: req.user._id }, { size: (Number(req.user.size) + file.size).toString() });
		fs.rename(file.filepath, `${location + req.user._id}/${file.originalFilename}`, function(err) {
			if (err) throw err;
		});
	});

	// log any errors that occur
	form.on('error', function(err) {
		req.flash('error', err);
		res.redirect('/files');
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
		// delete file / folder
		if (p.isFile()) {
			await fs.unlinkSync(location + req.user._id + req.body.path);
		} else {
			await fs.rmdirSync(location + req.user._id + req.body.path, { recursive: true });
		}
		res.redirect('/files');
	} catch (err) {
		console.log(err);
		req.flash('error', err.message);
		res.redirect('/files');
	}
});

router.post('/share', ensureAuthenticated, async (req, res) => {
	try {
		const user = await UserSchema.findOne({ _id: req.user._id });
		let link = randomStr(20, '12345abcde'),
			path = req.body.path;

		// Make sure item isn't already being shared
		if (user.shared.find(item => item.path == req.body.path)) {
			link = user.shared.find(item => item.path == req.body.path).id;
			path = user.shared.find(item => item.path == req.body.path).path;
		} else {
			// Make sure no duplicate share links
			while (user.shared.find(item => item.id == link)) {
				link = randomStr(20, '12345abcde');
			}
			user.shared.push({ id: link, path: req.body.path });
			await user.save();
		}

		// send data back to front-end
		res.json({ success: { id: link, path: path } });
	} catch (err) {
		console.log(err);
		res.json({ error: err.message });
	}
});

// Convert folders to ZIP and send to user
router.post('/download', ensureAuthenticated, async (req, res) => {
	const JSZip = require('jszip');
	const zip = new JSZip();

	zip.file(
		'standalone.txt',
		'I will exist inside of the zip archive, but I\'m not a real file here on the server.',
	);

	const files = dirstuff(`${location}${req.user._id}/${req.body.path}`, [], '');
	files.forEach((file) => {
		// console.log(`file: ${file}`);
		// console.log(`${location}${req.user._id}/${req.body.path}${file}`);
		zip.file(file, fs.readFileSync(`${location}${req.user._id}/${req.body.path}${file}`, 'utf-8'));
	});

	// addFilesFromDirectoryToZip(`${location}${req.user._id}/${req.body.path}`, req.user._id, zip);

	const zipAsBase64 = await zip.generateAsync({ type: 'base64' });
	res.json({ data: zipAsBase64 });
});

function dirstuff(directoryPath, items, parent) {
	const directoryContents = fs.readdirSync(directoryPath, {
		withFileTypes: true,
	});
	directoryContents.forEach(({ name }) => {
		const path = `${directoryPath}/${name}`;
		if (fs.statSync(path).isFile()) items.push(`${parent}/${name}`);
		if (fs.statSync(path).isDirectory()) items.push(...dirstuff(path, items, `${parent}/${name}`));
	});
	return items;
}


function addFilesFromDirectoryToZip(directoryPath, userID, zip) {
	const directoryContents = fs.readdirSync(directoryPath, {
		withFileTypes: true,
	});
	console.log(directoryPath);
	directoryContents.forEach(({ name }) => {
		const path = `${directoryPath}/${name}`;
		if (fs.statSync(path).isFile()) zip.file(name, fs.readFileSync(path, 'utf-8'));
		if (fs.statSync(path).isDirectory()) addFilesFromDirectoryToZip(path, userID, zip);
	});
}

// create search query
router.post('/search', ensureAuthenticated, (req, res) => {
	res.redirect(`/files/search?query=${req.body.search}&fileType=${req.body.fileType}&dateUpdated=${req.body.dateUpdated}`);
});

// Rename file/folder
router.post('/rename', ensureAuthenticated, (req, res) => {
	const { folder, oldName, newName } = req.body;
	fs.rename(`${location}${req.user._id}${folder}/${oldName}`, `${location}${req.user._id}${folder}/${newName}${require('path').extname(oldName)}`, function(err) {
		if (err) return res.json({ error: err.message });
		req.flash('success', 'File successfully renamed');
		res.redirect('/files');
	});
});

// Move a file/folder somewhere else
router.post('/move-to', ensureAuthenticated, (req, res) => {
	const { oldPath, newPath } = req.body;
	fs.rename(oldPath, newPath, function(err) {
		if (err) return res.json({ error: err.message });
		res.json({ success: 'File successfully moved' });
	});
});

// copy a file/folder somewhere else
router.post('/copy-to', ensureAuthenticated, (req, res) => {
	const { oldPath, newPath } = req.body;
	fs.rename(oldPath, newPath, function(err) {
		if (err) return res.json({ error: err.message });
		res.json({ success: 'File successfully moved' });
	});
});

router.post('/change', ensureAuthenticated, (req, res) => {
	console.log(req.body);
});

module.exports = router;

// Create random alphanumerical string
function randomStr(len, arr) {
	let ans = '';
	for (let i = len; i > 0; i--) {
		ans += arr[Math.floor(Math.random() * arr.length)];
	}
	return ans;
}
