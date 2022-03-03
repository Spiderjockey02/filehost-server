const express = require('express'),
	{ ensureAuthenticated } = require('../config/auth'),
	location = process.cwd() + '/src/website/files/userContent/',
	{ UserSchema } = require('../../models'),
	fs = require('fs'),
	{ company } = require('../../config'),
	{ logger } = require('../../utils'),
	md = require('marked'),
	imageThumbnail = require('image-thumbnail'),
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
		error: req.flash('error'),
		success: req.flash('success'),
		company,
	});
});

// Login page
router.get('/login', (req, res) => {
	// Only access page if user isn't signed in
	if (req.isAuthenticated()) return res.redirect('/files');

	res.render('navbar/login', {
		user: null,
		error: req.flash('error'),
		userID: req.flash('userID'),
	});
});

// Sign up page
router.get('/signup', (req, res) => {
	// Only access page if user isn't signed in
	if (req.isAuthenticated()) return res.redirect('/files');
	res.render('navbar/signup', {
		user: null,
		error: 	req.flash('error'),
		name:	req.flash('name'),
		email:	req.flash('email'),
	});
});

// Show user content like images/videos etc
router.get('/user-content/:userID/*', ensureAuthenticated, (req, res) => {
	// Make sure no one else accessing their data
	if (req.user._id == req.params.userID) {
		// Send file, if it doesn't exist error
		const path = decodeURI(location + req._parsedOriginalUrl.pathname.slice(14));
		if (require('mime-types').lookup(path).split('/')[0] == 'video') {
			const fileSize = fs.statSync(path).size,
				videoRange = req.headers.range;

			if (videoRange) {
				const parts = videoRange.replace(/bytes=/, '').split('-'),
					start = parseInt(parts[0], 10),
					end = fileSize - 1,
					chunksize = (end - start) + 1,
					file = fs.createReadStream(path, { start, end });

				res.writeHead(206, {
					'Content-Range': `bytes ${start}-${end}/${fileSize}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': chunksize,
					'Content-Type': 'video/mp4',
				});
				file.pipe(res);
			} else {
				res.writeHead(200, {
					'Content-Length': fileSize,
					'Content-Type': 'video/mp4',
				});
				fs.createReadStream(path).pipe(res);
			}
		} else {
			res.sendFile(path, (err) => {
				if (err) {
					return res.status(404)
						.render('404-page.ejs', {
							user: req.isAuthenticated() ? req.user : null,
							company,
						});
				}
			});
		}
	} else {
		res.status(403)
			.render('403-page.ejs', {
				user: req.isAuthenticated() ? req.user : null,
				company,
			});
	}
});

router.get('/thumbnail/:userID/*', ensureAuthenticated, async (req, res) => {
	// Make sure no one else accessing their data
	if (req.user._id == req.params.userID) {
		const path = decodeURI(process.cwd() + '/src/website/files/thumbnails/' + req._parsedOriginalUrl.pathname.slice(11));
		if (fs.existsSync(path)) {
			res.sendFile(path, (err) => {
				if (err) console.log(err);
			});
		} else {
			const options = { percentage: 25, responseType: 'base64' };
			try {
				const thumbnail = await imageThumbnail(decodeURI(process.cwd() + '/src/website/files/userContent/' + req._parsedOriginalUrl.pathname.slice(11)), options);
				const img = Buffer.from(thumbnail, 'base64');

				res.writeHead(200, {
					'Content-Type': 'image/png',
					'Content-Length': img.length,
				});
				res.end(img);
			} catch (err) {
				console.log(err);
				res.sendFile(process.cwd() + '/src/website/public/img/file-icon.png');
			}
		}
	} else {
		res.status(403)
			.render('403-page.ejs', {
				user: req.isAuthenticated() ? req.user : null,
				company,
			});
	}
});

router.get('/avatar/:userID', ensureAuthenticated, (req, res) => {
	// Make sure no one else accessing their data
	if (req.user._id == req.params.userID) {
		const path = decodeURI(`${process.cwd()}/src/website/files/avatars/${req.user._id}.png`);
		if (fs.existsSync(path)) {
			res.sendFile(path, (err) => {
				if (err) console.log(err);
			});
		} else {
			res.redirect('/img/default-avatar.webp');
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
		user: req.user,
		files: files.recent,
		formatBytes: require('../../utils').formatBytes,
	});
});

// Show user's favourites
router.get('/favourites', ensureAuthenticated, (req, res) => {
	res.render('user/favourites', {
		user: req.user,
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
