const express = require('express'),
	ReferralLinks = require('../../analytics/referralLinks'),
	{ company } = require('../../config'),
	router = express.Router();

const counter = new ReferralLinks();
// Redirect to twitter
router.get('/twitter', async (req, res) => {
	await counter.updateCounter('twitter');
	res.redirect(company.twitterURL);
});

// Redirect to facebook
router.get('/facebook', async (req, res) => {
	await counter.updateCounter('facebook');
	res.redirect(company.facebookURL);
});

// Redirect to instagram
router.get('/instagram', async (req, res) => {
	await counter.updateCounter('instagram');
	res.redirect(company.instagramURL);
});

// Redirect to linkedin
router.get('/linkedin', async (req, res) => {
	await counter.updateCounter('linkedin');
	res.redirect(company.linkedinURL);
});

module.exports = router;
