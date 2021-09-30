const express = require('express'),
	router = express.Router(),
	{ logger } = require('../../utils'),
	passport = require('passport');

// send to facebook to do the authentication
router.get('/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

// handle the callback after facebook has authenticated the user
router.get('/facebook/callback', (req, res, next) => passport.authenticate('facebook', function(err, user) {
	if (!user) return res.redirect(`/login?error=${err.message}`);

	req.logIn(user, function(err) {
		if (err) return next(err);
		logger.log(`User logged in: ${user.name} via facebook`);
		return res.redirect('/files');
	});
})(req, res, next));

// send to twitter to do the authentication
router.get('/twitter', passport.authenticate('twitter', { scope : 'email' }));

// handle the callback after twitter has authenticated the user
router.get('/twitter/callback', (req, res, next) => passport.authenticate('twitter', function(err, user) {
	if (!user) return res.redirect(`/login?error=${err.message}`);

	req.logIn(user, function(err) {
		if (err) return next(err);
		logger.log(`User logged in: ${user.name} via twitter`);
		return res.redirect('/files');
	});
})(req, res, next));

// send to google to do the authentication
router.get('/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

// the callback after google has authenticated the user
router.get('/google/callback', (req, res, next) => passport.authenticate('google', function(err, user) {
	if (!user) return res.redirect(`/login?error=${err.message}`);

	req.logIn(user, function(err) {
		if (err) return next(err);
		logger.log(`User logged in: ${user.name} via google`);
		return res.redirect('/files');
	});
})(req, res, next));

module.exports = router;
