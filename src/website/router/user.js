const express = require('express'),
	router = express.Router(),
	{ UserSchema } = require('../../models'),
	{ ensureAuthenticated } = require('../config/auth'),
	bcrypt = require('bcrypt'),
	fs = require('fs'),
	{ company } = require('../../config'),
	{ logger } = require('../../utils'),
	location = process.cwd() + '/src/website/files/userContent/',
	{ validate } = require('deep-email-validator'),
	{ IncomingForm } = require('formidable'),
	passport = require('passport');


// User is trying to login
router.post('/login', (req, res, next) => {
	passport.authenticate('local', function(err, user, info) {
		// an error occured / unsuccessful log in
		if (!user) {
			req.flash('error', info.message);
			req.flash('userID', info.ID);
			return res.redirect('/login');
		}

		// User logged in
		req.logIn(user, function(err) {
			if (err) return next(err);
			logger.log(`User logged in: ${user.email ?? user.name}`);
			return res.redirect('/files');
		});
	})(req, res, next);
});

// User is creating a new account
router.post('/register', require('../config/RateLimit').createAccountLimiter, async (req, res) => {
	let error;
	const { name, email, password, password2 } = req.body;

	// Check all fields were filled in
	if (!name || !email || !password || !password2) error = 'Please fill in all fields!';

	// check if passwords match
	if (password !== password2) error = 'Passwords dont match!';


	// check if password is more than 6 characters
	if (password.length < 6) error = 'Password must be atleast 6 characters long!';

	// save name and email in session in case of error
	req.flash('name', name);
	req.flash('email', email);

	// If an error was found notify user
	if (error) {
		req.flash('error', error);
		return res.redirect('/signup');
	}

	// Check if user already exists
	const user = await UserSchema.findOne({ email: email });
	if (user) {
		req.flash('error', 'Email is already registered!');
		return res.redirect('/signup');
	}

	// Check if email is valid
	const resp = await validate({ email: email, validateSMTP: false });
	if (!resp.valid) {
		req.flash('error', resp.validators[resp.reason].reason);
		res.redirect('/signup');
	}

	// Create new user model
	const newUser = new UserSchema({
		name : name,
		email : email,
		password : password,
	});

	// Check if email needs verifing
	if (require('../../config').mailService.enable) {
		await require('axios').get(`${require('../../config').mailService.domain}/verify?email=${email}&ID=${newUser._id}`);
	} else {
		newUser.verified = true;
	}

	// Encrypt password (Dont save raw password to database)
	try {
		const salt = await bcrypt.genSalt(10);
		newUser.password = await bcrypt.hash(newUser.password, salt);
	} catch (err) {
		req.flash('error', 'Failed to encrypt password');
		res.redirect('/signup');
		return console.log(err);
	}

	// Save the new user to database + make sure to create folder
	try {
		await newUser.save();
		fs.mkdirSync(location + newUser._id);
		logger.log(`New user: ${newUser.email}`);
		if (require('../../config').mailService.enable) {
			req.flash('error', 'Please check your email to verify your email');
			res.redirect('/login');
		} else {
			res.redirect('/files');
		}
	} catch (err) {
		console.log(err);
		req.flash('error', 'An error has occured');
		res.redirect('/login');
	}
});

// logout
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

// Upload new avatar
router.post('/avatar/upload', (req, res) => {
	const form = new IncomingForm({
		multiples: true,
		allowEmptyFiles: false,
		maxFileSize: require('../../config').uploadLimit,
		maxFieldsSize: require('../../config').uploadLimit,
		uploadDir: location });

	// File has been uploaded (create folders if neccessary)
	form.on('file', async function(field, file) {
		fs.rename(file.path, `${process.cwd()}/src/website/files/avatars/${req.user._id}.png`, function(err) {
			if (err) throw err;
		});
		res.redirect('/user/dashboard');
	});

	// log any errors that occur
	form.on('error', function(err) {
		res.redirect(`/files?error=${err}`);
	});

	// parse the incoming request containing the form data
	form.parse(req);
});

// Upload new avatar
router.post('/avatar/delete', (req, res) => {
	fs.unlink(`${process.cwd()}/src/website/files/avatars/${req.user._id}.png`, function(err) {
		if (err) throw err;
	});
	res.redirect('/user/dashboard');
});

// Show user's favourites
router.get('/trash', ensureAuthenticated, (req, res) => {
	res.render('user/trash', {
		user: req.user,
		...require('../../utils'),
	});
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
	res.render('navbar/dashboard', {
		user: req.user,
		option: req.query.option,
		error: req.flash('error'),
		success: req.flash('success'),
		company,
	});
});

module.exports = router;
