const express = require('express'),
	{ ensureAuthenticated } = require('../config/auth'),
	User = require('../../models/user'),
	fs = require('fs'),
	router = express.Router();

// Home page
router.get('/', (req, res) => {
	const files = require('../../utils/directory')(process.cwd() + '/src/website/files/');
	const number = getNumberOfFiles(files, 0);
	res.render('index', {
		auth: req.isAuthenticated(),
		NumFiles: number,
	});
});

// Login page
router.get('/login', (req, res) => {
	res.render('user/login', {
		auth: req.isAuthenticated(),
		error: req.query.error ?? undefined,
	});
});

// Sign up page
router.get('/signup', (req, res) => {
	res.render('user/signup', {
		auth: req.isAuthenticated(),
		error: req.query.error,
		name: req.query.name,
		email: req.query.email,
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

// Show user's favourites
router.get('/trash', ensureAuthenticated, (req, res) => {
	res.render('user/trash', {
		auth: req.isAuthenticated(),
	});
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
	const path = process.cwd() + '/src/files/' + req.user._id + '/avatar.png';
	res.render('user/dashboard', {
		auth: req.isAuthenticated(),
		user: req.user,
		option: req.query.option,
		error: req.query.error,
		success: req.query.success,
		avatar: fs.existsSync(path) ? fs.readFileSync(decodeURI(path)) : undefined,
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
