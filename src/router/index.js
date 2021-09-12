const express = require('express'),
	router = express.Router();

router.get('/', (req, res) => {
	const files = require('../utils/directory')(process.cwd() + '/src/files/');
	const number = getNumberOfFiles(files, 0);
	const size = getTotalSize(files, 0);
	console.log(number);
	console.log(size);
	res.render('index', {
		auth: req.isAuthenticated(),
		NumFiles: number,
		size: formatBytes(size),
	});
});

router.get('/login', (req, res) => {
	res.render('user/login', {
		auth: req.isAuthenticated(),
	});
});

router.get('/signup', (req, res) => {
	res.render('user/signup', {
		auth: req.isAuthenticated(),
	});
});

router.get('/robots.txt', (req, res) => {
	res.sendFile('../assets/robots.txt');
});

module.exports = router;

// Get number of files
function getNumberOfFiles(n, num) {
	for (const file of n.children) {
		if (file.type == 'directory') {
			num = getNumberOfFiles(file, num);
		}
		num++;
	}
	return num;
}

// Get total file size
function getTotalSize(n, num) {
	for (const file of n.children) {
		console.log(n);
		console.log(num);
		if (file.type == 'directory') {
			num = getTotalSize(file, num);
		}
		num += file.size;
	}
	return num;
}

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024,
		dm = decimals < 0 ? 0 : decimals,
		sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
