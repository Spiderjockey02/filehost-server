const express = require('express'),
	router = express.Router(),
	dirTree = require('../directory'),
	{ ensureAuthenticated } = require('../config/auth'),
	fs = require('fs'),
	fresh = require('fresh');

const location = process.cwd() + '/src/files/';

// Show file explorer
router.get('/*', ensureAuthenticated, (req, res) => {
	// Check if file path exists
	const path = location + req.user.email + req.originalUrl.substring(6, req.originalUrl.length);
	console.log(path);
	if (fs.existsSync(path)) {
		// Now check if file is a folder or file
		const files = dirTree(path);
		console.log(files);
		if (files.type == 'file') {
			console.log('yes');
			// Read file from cached
			if (isFresh(req, res)) {
				res.statusCode = 304;
				res.end();
				return;
			}

			// new file
			res.status(200).sendFile(path, (err) => {
				if (err) return res.status(404).end('content not found.');
			});
		} else {
			res
				.status(200)
				.render('files', {
					files: files,
					path: (req.originalUrl == '/files' ? '/' : req.originalUrl),
					filter: req.query.filter,
					auth: req.isAuthenticated(),
					user: req.user,
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
		console.log('no');
		res.send('no');
	}
});


// upload files to user's account
router.post('/upload', ensureAuthenticated, (req, res, next) => {
	console.log(req);
	console.log(req.files);
	console.log(req.query);
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}
	// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
	const sampleFile = req.files.sampleFile;

	sampleFile.mv(location + (req.query.path ?? '/') + sampleFile.name, function(err) {
		if (err) return res.status(500).send(err);
		next();
	});
});

// Caching
function isFresh(req, res) {
	return fresh(req.headers, {
		'etag': res.getHeader('ETag'),
		'last-modified': res.getHeader('Last-Modified'),
	});
}

module.exports = router;
