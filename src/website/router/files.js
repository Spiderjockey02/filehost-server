const express = require('express'),
	router = express.Router(),
	{ logger, dirTree } = require('../../utils'),
	{ ensureAuthenticated } = require('../config/auth'),
	User = require('../../models/user'),
	fs = require('fs'),
	fresh = require('fresh'),
	{ IncomingForm } = require('formidable'),
	location = process.cwd() + '/src/website/files/';

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
					await User.findOneAndUpdate({ _id: req.user._id }, { recent: user.recent });
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
			});
		}
	} else {
		res.send('No files found');
	}
});


// upload files to user's account
router.post('/upload', ensureAuthenticated, async (req, res) => {
	const form = new IncomingForm({ multiples: true, allowEmptyFiles: false, maxFieldsSize : 50 * 1024 * 1024, uploadDir: location });

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
			console.log('renamed complete: ' + file.name);
		});
	});

	// log any errors that occur
	form.on('error', function(err) {
		res.redirect(`/files?error=${err}`);
	});

	// once all the files have been uploaded, send a response to the client
	form.on('end', function() {
		res.statusCode = 200;
		res.redirect('/files');
		res.end();
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
		await User.findOneAndUpdate({ _id: req.user._id }, { size: Number(req.user.size ?? 0) - p.size });
		// delete file
		await fs.unlinkSync(location + req.user._id + req.body.path);
		res.redirect('/files');
	} catch (err) {
		res.redirect(`/files?error=${err.message}`);
	}
});

router.post('/share', ensureAuthenticated, async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.user._id });
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
