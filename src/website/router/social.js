const express = require('express'),
	router = express.Router();

// Redirect to twitter
router.get('/twitter', (req, res) => {
	res.redirect('https://twitter.com');
});

// Redirect to facebook
router.get('/facebook', (req, res) => {
	res.redirect('https://facebook.com');
});

// Redirect to instagram
router.get('/instagram', (req, res) => {
	res.redirect('https://instagram.com');
});

// Redirect to linkedin
router.get('/linkedin', (req, res) => {
	res.redirect('https://linkedin.com');
});

module.exports = router;
