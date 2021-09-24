const express = require('express'),
	router = express.Router(),
	{ logger, dirTree } = require('../../utils'),
	{ ensureAuthenticated } = require('../config/auth'),
	User = require('../../models/user'),
	fs = require('fs'),
	fresh = require('fresh'),
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
				auth: req.isAuthenticated(),
				fileInfo: Object.assign(files, { mimeType: require('mime-types').lookup(files.extension) }),
				file: req.user._id + URLpath.substring(6, URLpath.length),
				domain: require('../../config').domain,
			});
		} else {
			res.render('user/files', {
				files: files,
				path: (URLpath == '/files' ? '/' : URLpath),
				auth: req.isAuthenticated(),
				user: req.user,
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
	if (!req.files || Object.keys(req.files).length === 0) res.redirect('/files?error=No files were uploaded');

	// Find where to place the file
	const sampleFile = req.files.sampleFile,
		path = req.body['path'],
		directPath = path.split('/').slice(2, path.length).join('/');
	let newPath = location + req.user._id + '/' + directPath + '/' + sampleFile.name,
		times = 1;

	// Check if file is too big
	if (sampleFile.truncated) return res.redirect('/files?error=File was too big to upload (Limit 50MB)');

	// Make sure if the file is uploaded it doesn't go over the limit (5GB)
	if (Number(req.user.size ?? 0) + sampleFile.size >= 5 * 1024 * 1024 * 1024)	return res.redirect('/files?error=You have reached your data limit (Limit 5GB)');

	// Make sure not to upload duplicate files (add (x) to the end)
	while (fs.existsSync(newPath)) {
		const index = sampleFile.name.lastIndexOf('.');
		const name = sampleFile.name.substring(0, index) + ` (${times})` + sampleFile.name.substring(index);
		newPath = location + req.user._id + '/' + directPath + '/' + name;
		times++;
	}

	await User.findOneAndUpdate({ _id: req.user._id }, { size: Number(req.user.size ?? 0) + sampleFile.size });
	// save file
	sampleFile.mv(newPath, function(err) {
		if (err) return res.status(500).send(err);
		res.redirect('/files' + `${directPath ? `/${directPath}` : '/'}`);
	});
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
// Caching
function isFresh(req, res) {
	return fresh(req.headers, {
		'etag': res.getHeader('ETag'),
		'last-modified': res.getHeader('Last-Modified'),
	});
}

module.exports = router;
