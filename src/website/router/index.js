const express = require('express'),
	{ ensureAuthenticated } = require('../config/auth'),
	location = process.cwd() + '/src/website/files/userContent/',
	{ UserSchema } = require('../../models'),
	fs = require('fs'),
	{ company } = require('../../config'),
	{ logger } = require('../../utils'),
	md = require('marked'),
	router = express.Router();

// Home page
router.get('/', async (req, res) => {
	const files = require('../../utils/directory')(location),
		number = getNumberOfFiles(files, 0),
		userCount = await UserSchema.find().then(resp => resp.length);

	// render page
	res.render('index', {
		user: req.isAuthenticated() ? req.user : null,
		NumFiles: number - userCount,
		size: getTotalSize(files, 0),
		formatBytes: require('../../utils').formatBytes,
		userCount, company,
	});
});

// For web scalpers
router.get('/robots.txt', (req, res) => res.sendFile(process.cwd() + '/src/website/assets/robots.txt'));

// For web scalpers
router.get('/arc-sw.js', (req, res) => res.sendFile(process.cwd() + '/src/website/public/js/arc-sw.js'));

// Site map
router.get('/sitemap.xml', (req, res) => res.sendFile(process.cwd() + '/src/website/assets/sitemap.xml'));

// Terms and conditions page
router.get('/terms-and-conditions', (req, res) => {
	res.render('navbar/terms', {
		user: req.isAuthenticated() ? req.user : null,
		terms: md(fs.readFileSync('./src/website/assets/TERMS.md', 'utf8').replace(/\{\{companyName\}\}/g, company.name)),
		company,
	});
});

// Privacy policy page
router.get('/privacy-policy', (req, res) => {
	res.render('navbar/privacy', {
		user: req.isAuthenticated() ? req.user : null,
		privacy: md(fs.readFileSync('./src/website/assets/PRIVACY.md', 'utf8').replace(/\{\{companyName\}\}/g, company.name)),
		company,
	});
});

// FAQ page
router.get('/FAQ', (req, res) => res.send('FAQ page coming soon'));

// Contact us page
router.get('/contact-us', (req, res) => {
	res.render('navbar/contact-us', {
		user: req.isAuthenticated() ? req.user : null,
		error: req.query.error,
		company,
	});
});

// Login page
router.get('/login', (req, res) => {
	// Only access page if user isn't signed in
	if (req.isAuthenticated()) return res.redirect('/files');
	res.render('navbar/login', {
		user: req.isAuthenticated() ? req.user : null,
		error: req.query.error,
	});
});

// Sign up page
router.get('/signup', (req, res) => {
	// Only access page if user isn't signed in
	if (req.isAuthenticated()) return res.redirect('/files');
	res.render('navbar/signup', {
		user: req.isAuthenticated() ? req.user : null,
		error: req.query.error,
		name: req.query.name,
		email: req.query.email,
	});
});

// Show user content like images/videos etc
router.get('/user-content/:userID/*', ensureAuthenticated, (req, res) => {
	// Make sure no one else accessing their data
	if (req.user._id == req.params.userID) {
		// Send file, if it doesn't exist error
		const path = decodeURI(location + req._parsedOriginalUrl.pathname.slice(14));
		res.sendFile(path, (err) => {
			if (err) {
				return res.status(404)
					.render('404-page.ejs', {
						user: req.isAuthenticated() ? req.user : null,
						company,
					});
			}
		});
	} else {
		res.status(403)
			.render('403-page.ejs', {
				user: req.isAuthenticated() ? req.user : null,
				company,
			});
	}
});

router.get('/thumbnail/:userID/*', ensureAuthenticated, (req, res) => {
	// Make sure no one else accessing their data
	console.log('test');
	if (req.user._id == req.params.userID) {
		const path = decodeURI(process.cwd() + '/src/website/files/thumbnails/' + req._parsedOriginalUrl.pathname.slice(11));
		if (fs.existsSync(path)) {
			res.sendFile(path, (err) => {
				if (err) console.log(err);
			});
		} else {
			res.sendFile(process.cwd() + '/src/website/public/img/file-icon.png');
		}
	} else {
		res.status(403)
			.render('403-page.ejs', {
				user: req.isAuthenticated() ? req.user : null,
				company,
			});
	}
});

// People's shared files/folders
router.get('/share/:ID/:path*', async (req, res) => {
	try {
		const user = await UserSchema.findOne({ _id: req.params.ID });
		if (user) {
			const file = user.shared.find(item => item.id == req.params.path).path;
			return res.sendFile(decodeURI(location + req.params.ID + file), (err) => {
				if (err) return res.status(404).end('File not longer exists');
			});
		} else {
			res.status(400).end('Invalid URL');
		}
	} catch (err) {
		logger.log(`/share/${req.params.ID}/${req.params.path} -> Error: ${err.message}`, 'error');
		res.status(500).end(err.message);
	}
});

// Show user's recent viewings
router.get('/recent', ensureAuthenticated, async (req, res) => {
	const files = await UserSchema.findOne({ email: req.user.email });
	res.render('user/recent', {
		user: req.isAuthenticated() ? req.user : null,
		files: files.recent,
		formatBytes: require('../../utils').formatBytes,
	});
});

// Show user's favourites
router.get('/favourites', ensureAuthenticated, (req, res) => {
	res.render('user/favourites', {
		user: req.isAuthenticated() ? req.user : null,
		formatBytes: require('../../utils').formatBytes,
	});
});

module.exports = router;

// Get number of files
function getNumberOfFiles(n, num) {
	for (const file of n.children) {
		if (file.type == 'directory') num = getNumberOfFiles(file, num);
		num++;
	}
	return num;
}

function getTotalSize(n, num) {
	for (const file of n.children) {
		num = (file.type == 'directory') ? getTotalSize(file, num) : num + file.size;
	}
	return num;
}
