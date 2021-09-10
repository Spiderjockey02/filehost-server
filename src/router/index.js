const express = require('express'),
	router = express.Router();

router.get('/', (req, res) => {
	res.render('index', {
		auth: req.isAuthenticated(),
	});
});

router.get('/login', (req, res) => {
	res.render('login');
});

router.get('/signup', (req, res) => {
	res.render('signup');
});

router.get('/robots.txt', (req, res) => {
	res.sendFile('../assets/robots.txt');
});

module.exports = router;
