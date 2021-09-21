const express = require('express'),
	router = express.Router(),
	User = require('../../models/user'),
	{ ensureAuthenticated } = require('../config/auth'),
	bcrypt = require('bcrypt'),
	fs = require('fs'),
	logger = require('../../utils/logger'),
	location = process.cwd() + '/src/website/files/',
	passport = require('passport');

// User is trying to login
router.post('/login', (req, res, next) => {
	passport.authenticate('local', function(err, user, info) {
		// an error occured / unsuccessful log in
		if (!user) return res.redirect(`/login?error=${info.message}`);

		// User logged in
		req.logIn(user, function(err) {
			if (err) return next(err);
			logger.log(`User logged in: ${user.email ?? user.name}`);
			return res.redirect('/files');
		});
	})(req, res, next);
});

// User is creating a new account
router.post('/register', (req, res) => {
	let error;
	const { name, email, password, password2 } = req.body;
	console.log(' Name ' + name + ' email :' + email + ' pass:' + password);

	// Check all fields were filled in
	if (!name || !email || !password || !password2) error = 'Please fill in all fields!';

	// check if passwords match
	if (password !== password2) error = 'Passwords dont match!';


	// check if password is more than 6 characters
	if (password.length < 6)	error = 'Password must be atleast 6 characters long!';

	// If an error was found notify user
	if (error) return res.redirect(`/signup?error=${error}&name=${name}&email=${email}`);

	// Make sure email isn't already on the database
	User.findOne({ email : email }).exec((err, user) => {
		console.log(user);
		if (user) {
			error = 'Email is already registered!';
			res.render('user/signup', {
				auth: req.isAuthenticated(),
				error, name, email, password, password2 });
		} else {
			const newUser = new User({
				name : name,
				email : email,
				password : password,
			});

			// hash password
			bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, async (err, hash) => {
				if (err) throw err;
				// save pass to hash
				newUser.password = hash;
				// save user
				try {
					await newUser.save();
					const t = fs.mkdirSync(location + newUser._id);
					console.log(t);
					logger.log(`New user: ${newUser.email}`);
					res.redirect('/files');
				} catch (err) {
					console.log(err);
				}
			}));
		}
	});
});

// logout
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

// Upload new avatar
router.post('/avatar/upload', (req, res) => {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}

	// Find where to place the file
	const sampleFile = req.files.sampleFile;
	console.log(sampleFile);
	const newPath = location + req.user._id + '/' + 'avatar.png';

	// save file
	sampleFile.mv(newPath, async function(err) {
		if (err) return res.status(500).send(err);
		res.redirect('/dashboard');
	});
});

router.post('/password_update', (req, res) => {
	let error;
	const { password, password2 } = req.body;

	// Check all fields were filled in
	if (!password || !password2) error = 'Please fill in all fields!';

	// check if passwords match
	if (password !== password2) error = 'Passwords dont match!';

	// check if password is more than 6 characters
	if (password.length < 6)	error = 'Password must be atleast 6 characters long!';

	// If an error was found notify user
	if (error) return res.redirect(`/dashboard?error=${error}`);

	bcrypt.genSalt(10, (err, salt) => bcrypt.hash(password, salt, async (err, hash) => {
		if (err) throw err;
		await User.findOneAndUpdate({ _id: req.user.id }, { password: hash });
		res.redirect('/dashboard?option=2&success=Password successfully updated');
	}));
});

// Show user's recent viewings
router.get('/recent', ensureAuthenticated, async (req, res) => {
	const files = await User.findOne({ email: req.user.email });
	res.render('user/recent', {
		auth: req.isAuthenticated(),
		files: files.recent,
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
});

// Show user's favourites
router.get('/favourites', ensureAuthenticated, (req, res) => {
	res.render('user/favourites', {
		auth: req.isAuthenticated(),
		user: req.user,
	});
});

// Show user's favourites
router.get('/trash', ensureAuthenticated, (req, res) => {
	res.render('user/trash', {
		auth: req.isAuthenticated(),
	});
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
	const path = location + req.user._id + '/avatar.png';
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
