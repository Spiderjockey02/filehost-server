const express = require('express'),
	router = express.Router();

// Redirect to twitter (could be used for )
router.get('/twitter', (req, res) => {
	res.redirect('https://twitter.com');
});

router.get('/facebook', (req, res) => {
	res.redirect('https://facebook.com');
});

router.get('/instagram', (req, res) => {
	res.redirect('https://instagram.com');
});

router.get('/linkedin', (req, res) => {
	res.redirect('https://linkedin.com');
});
module.exports = router;
