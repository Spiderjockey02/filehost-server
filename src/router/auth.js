const express = require('express'),
	router = express.Router(),
	passport = require('passport');

// send to facebook to do the authentication
router.get('/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

// handle the callback after facebook has authenticated the user
router.get('/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect : '/files',
		failureRedirect : '/',
	}),
);

// twitter --------------------------------

// send to twitter to do the authentication
router.get('/twitter', passport.authenticate('twitter', { scope : 'email' }));

// handle the callback after twitter has authenticated the user
router.get('/twitter/callback',
	passport.authenticate('twitter', {
		successRedirect : '/files',
		failureRedirect : '/',
	}),
);


// google ---------------------------------

// send to google to do the authentication
router.get('/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

// the callback after google has authenticated the user
router.get('/google/callback',
	passport.authenticate('google', {
		successRedirect : '/files',
		failureRedirect : '/',
	}),
);

module.exports = router;
