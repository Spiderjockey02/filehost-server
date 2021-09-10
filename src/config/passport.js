const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

module.exports = function(passport) {
	passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
		try {
			// Check database for that email
			const user = User.findOne({ email: email });
			if (!user) return done(null, false, { message:'email not registered' });

			// Check if the password is correct
			bcrypt.compare(password, user.password, (err, isMatch) => {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'password incorrect' });
				}
			});
		} catch (err) {
			console.log(err);
		}
	}));

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});
};
