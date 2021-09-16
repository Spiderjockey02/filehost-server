const express = require('express'),
	router = express.Router(),
	User = require('../models/user'),
	bcrypt = require('bcrypt'),
	fs = require('fs'),
	passport = require('passport');

// Register handle
router.post('/login', (req, res, next) => {
	passport.authenticate('local', function(err, user, info) {
		// an error occured / unsuccessful log in
		if (!user) {
			return res.redirect(`/login?error=${info.message}`);
		}

		// User logged in
		req.logIn(user, function(err) {
			if (err) return next(err);
			console.log(user);
			return res.redirect('/files');
		});
	})(req, res, next);
});

// register post handle
router.post('/register', (req, res) => {
	let error;
	const { name, email, password, password2 } = req.body;
	console.log(' Name ' + name + ' email :' + email + ' pass:' + password);

	// Check all fields were filled in
	if (!name || !email || !password || !password2) {
		error = 'Please fill in all fields!';
	}

	// check if passwords match
	if (password !== password2) {
		error = 'Passwords dont match!';
	}

	// check if password is more than 6 characters
	if (password.length < 6) {
		error = 'Password must be atleast 6 characters long!';
	}

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
			bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
				if (err) throw err;
				// save pass to hash
				newUser.password = hash;
				// save user
				newUser.save()
					.then((value) => {
						console.log(value);
						fs.mkdirSync(process.cwd() + '/src/files/' + newUser._id);
						res.redirect('/files');
					})
					.catch(value=> console.log(value));
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
	const newPath = process.cwd() + '/src/files/' + req.user._id + '/' + 'avatar.png';

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
		res.redirect('/dashboard?success=Password successfully updated');
	}));
});
module.exports = router;
