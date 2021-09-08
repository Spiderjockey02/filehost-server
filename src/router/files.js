const express = require('express'),
	router = express.Router(),
	dirTree = require('directory-tree'),
	fresh = require('fresh');

router.get('/', (req, res) => {
	const path = req.query.path ?? '/';
	// console.log(process.cwd() + '/src/files' + path);
	// console.log(dirTree(process.cwd() + '/src/files' + path));
	// console.log(path);
	res.render('files', {
		files: dirTree(process.cwd() + '/src/files' + path),
		path: path,
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

router.get('/*', (req, res) => {
	if (isFresh(req, res)) {
		res.statusCode = 304;
		res.end();
		return;
	}
	res.status(200).sendFile(process.cwd() + '/src/files' + (req.query.path ?? '') + req.url.split('?')[0], (err) => {
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
