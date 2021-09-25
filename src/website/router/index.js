const express = require('express'),
	{ ensureAuthenticated } = require('../config/auth'),
	location = process.cwd() + '/src/website/files/',
	User = require('../../models/user'),
	fs = require('fs'),
	md = require('marked'),
	router = express.Router();

// Convert terms and conditions md to html
let termsMD = '';
fs.readFile('./src/website/assets/TERMS.md', function(err, data) {
	if (err) {
		console.log(err);
		termsMD = 'Error';
		return;
	}
	termsMD = data.toString().replace().replace(/\{\{companyName\}\}/g, require('../../config').company.name);
});

// Convert privacy policy md to html
let privacyMD = '';
fs.readFile('./src/website/assets/PRIVACY.md', function(err, data) {
	if (err) {
		console.log(err);
		privacyMD = 'Error';
		return;
	}
	privacyMD = data.toString().replace().replace(/\{\{companyName\}\}/g, require('../../config').company.name);
});

// Home page
router.get('/', async (req, res) => {
	const files = require('../../utils/directory')(location),
		number = getNumberOfFiles(files, 0),
		userCount = await User.find().then(resp => resp.length);
	res.render('index', {
		auth: req.isAuthenticated(),
		NumFiles: number,
		companyName: require('../../config').company.name,
		email: require('../../config').company.email,
		phone: require('../../config').company.phone,
		slogan: require('../../config').company.slogan,
		size: getTotalSize(files, 0),
		formatBytes: require('../../utils').formatBytes,
		userCount,
	});
});

// Login page
router.get('/login', (req, res) => {
	res.render('user/login', {
		auth: req.isAuthenticated(),
		error: req.query.error,
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

// See the site map
router.get('/sitemap.xml', (req, res) => {
	res.sendFile(process.cwd() + '/src/website/assets/sitemap.xml');
});

// Show user content like images/videos etc
router.get('/user-content/:userID/*', ensureAuthenticated, (req, res) => {
	// Make sure no one else accessing their data
	if (req.user._id == req.params.userID) {
		// Check if file path exists
		const URLpath = req._parsedOriginalUrl.pathname;
		const path = decodeURI(location + URLpath.slice(14));
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

// Terms and conditions page
router.get('/terms-and-conditions', (req, res) => {
	res.render('extra/terms', {
		auth: req.isAuthenticated(),
		terms: md(termsMD),
		companyName: require('../../config').company.name,
		email: require('../../config').company.email,
		phone: require('../../config').company.phone,
		slogan: require('../../config').company.slogan,
	});
});

// Privacy policy page
router.get('/privacy-policy', (req, res) => {
	res.render('extra/privacy', {
		auth: req.isAuthenticated(),
		privacy: md(privacyMD),
		companyName: require('../../config').company.name,
		email: require('../../config').company.email,
		phone: require('../../config').company.phone,
		slogan: require('../../config').company.slogan,
	});
});


router.get('/share/:ID/:path*', async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.ID });
		console.log(user);
		if (user) {
			console.log();
			const file = user.shared.find(item => item.id == req.params.path).path;
			return res.sendFile(decodeURI(location + req.params.ID + file));
		}
		return res.send('Incorrect ID');
	} catch (err) {
		console.log(err);
		res.send(err.message);
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

function getTotalSize(n, num) {
	for (const file of n.children) {
		if (file.type == 'directory') {
			num = getTotalSize(file, num);
		} else {
			num += file.size;
		}
	}
	return num;
}
