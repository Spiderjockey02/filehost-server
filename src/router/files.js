const express = require('express'),
	router = express.Router(),
	dirTree = require('../utils/directory'),
	{ ensureAuthenticated } = require('../config/auth'),
	fs = require('fs'),
	fresh = require('fresh');

const location = process.cwd() + '/src/files/';

// Show file explorer
router.get('/*', ensureAuthenticated, (req, res) => {
	// Check if file path exists
	const path = decodeURI(location + req.user.email + req.originalUrl.substring(6, req.originalUrl.length));
	if (fs.existsSync(path)) {
		// Now check if file is a folder or file
		const files = dirTree(path, null, null, 0);
		console.log(files);
		if (files.type == 'file') {
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
					fileInfo: files,
					file: fs.readFileSync(decodeURI(path)),
				});
		} else {
			res
				.status(200)
				.render('user/files', {
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
		res.send('No files found');
	}
});


// upload files to user's account
router.post('/upload', ensureAuthenticated, (req, res) => {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}

	// Find where to place the file
	const sampleFile = req.files.sampleFile;
	console.log(sampleFile);
	const path = req.body['path'];
	const directPath = path.split('/').slice(2, path.length).join('/');
	const newPath = location + req.user.email + '/' + directPath + '/' + sampleFile.name;

	// save file
	sampleFile.mv(newPath, function(err) {
		if (err) return res.status(500).send(err);
		res.redirect('/files/' + directPath);
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
