const express = require('express'),
	router = express.Router(),
	dirTree = require('../../utils/directory'),
	{ ensureAuthenticated } = require('../config/auth'),
	User = require('../../models/user'),
	fs = require('fs'),
	fresh = require('fresh');

const location = process.cwd() + '/src/website/files/';

// Show file explorer
router.get('/*', ensureAuthenticated, async (req, res) => {
	// Check if file path exists
	const URLpath = req._parsedOriginalUrl.pathname;
	const path = decodeURI(location + req.user._id + URLpath.substring(6, URLpath.length));
	if (fs.existsSync(path)) {
		// Now check if file is a folder or file
		const files = dirTree(path);
		if (files.type == 'file') {
			// update recently viewed files
			try {
				const user = await User.findOne({ email: req.user.email });
				if (user.recent.length >= 10) user.recent.shift();
				if (!user.recent.some((file) => file.path == URLpath.substring(6, URLpath.length))) {
					files.path = URLpath.substring(6, URLpath.length);
					user.recent = [...user.recent, files];
					await user.save();
				}
			} catch (err) {
				console.log(err);
			}

			// Read file from cached
			if (isFresh(req, res)) {
				res.statusCode = 304;
				return res.end();
			}

			// new file
			res
				.status(200)
				.render('user/file-preview', {
					auth: req.isAuthenticated(),
					fileInfo: Object.assign(files, { mimeType: require('mime-types').lookup(files.extension) }),
					file: req.user._id + URLpath.substring(6, URLpath.length),
					domain: require('../../config').domain,
				});
		} else {
			res
				.status(200)
				.render('user/files', {
					files: files,
					path: (URLpath == '/files' ? '/' : URLpath),
					auth: req.isAuthenticated(),
					user: req.user,
					error: req.query.error,
					formatBytes: function formatBytes(bytes, decimals = 2) {
						if (bytes === 0) return '0 Bytes';
						const k = 1024,
							dm = decimals < 0 ? 0 : decimals,
							sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
							i = Math.floor(Math.log(bytes) / Math.log(k));

						return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
					},
				});
		}
	} else {
		res.send('No files found');
	}
});


// upload files to user's account
router.post('/upload', ensureAuthenticated, async (req, res) => {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}

	// Find where to place the file
	const sampleFile = req.files.sampleFile;
	const path = req.body['path'];
	const directPath = path.split('/').slice(2, path.length).join('/');
	let newPath = location + req.user._id + '/' + directPath + '/' + sampleFile.name;
	let times = 1;

	// Check if file is too big
	if (sampleFile.truncated) {
		return res.redirect('/files?error=File was too big to upload (Limit 50MB)');
	}

	if ((req.user.size ?? 0) + sampleFile.size >= 5 * 1024 * 1024 * 1024) {
		return res.redirect('/files?error=You have reached your data limit (Limit 5GB)');
	}
	// Make sure not to upload duplicate files (add (x) to the end)
	while (fs.existsSync(newPath)) {
		const index = sampleFile.name.lastIndexOf('.');
		const name = sampleFile.name.substring(0, index) + ` (${times})` + sampleFile.name.substring(index);
		newPath = location + req.user._id + '/' + directPath + '/' + name;
		times++;
	}

	await User.findOneAndUpdate({ email: req.user.email }, { size: (req.user.size ?? 0) + sampleFile.size });
	// save file
	sampleFile.mv(newPath, function(err) {
		if (err) return res.status(500).send(err);
		res.redirect('/files' + `${directPath ? `/${directPath}` : '/'}`);
	});
});

router.post('/delete', ensureAuthenticated, (req, res) => {
	console.log(req.body);
	console.log(req.body.path);
	fs.unlinkSync(location + req.user._id + req.body.path);
	res.redirect('/files');
});

// Caching
function isFresh(req, res) {
	return fresh(req.headers, {
		'etag': res.getHeader('ETag'),
		'last-modified': res.getHeader('Last-Modified'),
	});
}

module.exports = router;
