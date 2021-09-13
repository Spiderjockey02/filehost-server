const express = require('express'),
	{ ensureAuthenticated } = require('../config/auth'),
	User = require('../models/user'),
	router = express.Router();

// Home page
router.get('/', (req, res) => {
	const files = require('../utils/directory')(process.cwd() + '/src/files/');
	const number = getNumberOfFiles(files, 0);
	console.log(number);
	res.render('index', {
		auth: req.isAuthenticated(),
		NumFiles: number,
	});
});

// Login page
router.get('/login', (req, res) => {
	res.render('user/login', {
		auth: req.isAuthenticated(),
	});
});

// Sign up page
router.get('/signup', (req, res) => {
	res.render('user/signup', {
		auth: req.isAuthenticated(),
	});
});

// For web scalpers
router.get('/robots.txt', (req, res) => {
	res.sendFile('../assets/robots.txt');
});

// Show user's recent viewings
router.get('/recent', ensureAuthenticated, async (req, res) => {
	const files = await User.findOne({ email: req.user.email });
	res.render('user/recent', {
		auth: req.isAuthenticated(),
		files: files.recent,
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

// Show user's favourites
router.get('/favourites', ensureAuthenticated, (req, res) => {
	res.render('user/favourites', {
		auth: req.isAuthenticated(),
	});
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
