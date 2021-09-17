const express = require('express'),
	{ ensureAuthenticated } = require('../config/auth'),
	location = process.cwd() + '/src/website/files/',
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
	res.sendFile(process.cwd() + '/src/website/assets/robots.txt');
});

// Show user content like images/videos etc
router.get('/user-content/:userID/*', ensureAuthenticated, (req, res) => {
	if (req.user._id == req.params.userID) {
		// Check if file path exists
		const URLpath = req._parsedOriginalUrl.pathname;
		const path = decodeURI(location + URLpath.slice(14));
		console.log(path);
		if (fs.existsSync(path)) {
			res.sendFile(path, (err) => {
				if (err) return res.status(404).end('content not found.');
			});
		} else {
			res.send('File not found');
		}
	} else {
		res
			.status(403)
			.send('Access denied!');
	}
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
