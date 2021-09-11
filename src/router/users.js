const express = require('express'),
	router = express.Router(),
	User = require('../models/user'),
	bcrypt = require('bcrypt'),
	fs = require('fs'),
	passport = require('passport');

// Register handle
router.post('/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect : '/files',
		failureRedirect: '/login',
		failureFlash : true,
	})(req, res, next);
});

// register post handle
router.post('/register', (req, res) => {
	console.log(req.body);
	const { name, email, password, password2 } = req.body;
	const errors = [];
	console.log(' Name ' + name + ' email :' + email + ' pass:' + password);
	// validation passed
	User.findOne({ email : email }).exec((err, user)=>{
		console.log(user);
		if(user) {
			errors.push({ msg: 'email already registered' });
			res.render('signup', { errors, name, email, password, password2 });
		} else {
			const newUser = new User({
				name : name,
				email : email,
				password : password,
			});

			// hash password
			bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash)=> {
				if (err) throw err;
				// save pass to hash
				newUser.password = hash;
				// save user
				newUser.save()
					.then((value) => {
						console.log(value);
						fs.mkdirSync(process.cwd() + '/src/files/' + email);
						res.redirect('/files');
					})
					.catch(value=> console.log(value));

			}));
		}
	});

});

// logout
router.get('/logout', (req, res)=>{
	req.logout();
	res.redirect('/');
});

module.exports = router;
