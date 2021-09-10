const express = require('express'),
	router = express.Router(),
	dirTree = require('../directory'),
	{ ensureAuthenticated } = require('../config/auth'),
	fresh = require('fresh');

const location = process.cwd() + '/src/files';

// Show file explorer
router.get('/', ensureAuthenticated, (req, res) => {
	const path = req.query.path ?? '/';
	res
		.status(200)
		.render('files', {
			files: dirTree(location + path),
			path: path,
			filter: req.query.filter,
			auth: req.isAuthenticated(),
			formatBytes: function formatBytes(bytes, decimals = 2) {
				if (bytes === 0) return '0 Bytes';
				const k = 1024,
					dm = decimals < 0 ? 0 : decimals,
					sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
					i = Math.floor(Math.log(bytes) / Math.log(k));

				return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
			},
		});
});

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

// Show file
router.get('/*', ensureAuthenticated, (req, res) => {
	// Read file from cache
	if (isFresh(req, res)) {
		res.statusCode = 304;
		res.end();
		return;
	}

	// new file
	res.status(200).sendFile(decodeURI(location + (req.query.path ?? '') + req.url.split('?')[0]), (err) => {
		if (err) return res.status(404).end('content not found.');
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
