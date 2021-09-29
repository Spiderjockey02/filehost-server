const express = require('express'),
	ReferralLinks = require('../../analytics/referralLinks'),
	router = express.Router();

const counter = new ReferralLinks();
// Redirect to twitter
router.get('/twitter', async (req, res) => {
	await counter.updateCounter('twitter');
	res.redirect('https://twitter.com');
});

// Redirect to facebook
router.get('/facebook', async (req, res) => {
	await counter.updateCounter('facebook');
	res.redirect('https://facebook.com');
});

// Redirect to instagram
router.get('/instagram', async (req, res) => {
	await counter.updateCounter('instagram');
	res.redirect('https://instagram.com');
});

// Redirect to linkedin
router.get('/linkedin', async (req, res) => {
	await counter.updateCounter('linkedin');
	res.redirect('https://linkedin.com');
});

module.exports = router;
