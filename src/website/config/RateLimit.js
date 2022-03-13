const RateLimit = require('express-rate-limit'),
	{ getIP } = require('../../utils/functions');

// Only allow 5 accounts a day
const createAccountLimiter = RateLimit({
	windowMs: 24 * 60 * 60 * 1000,
	max: 5,
	message: 'Too many accounts created from this IP, please try again after an hour',
});

// 100 webpages every 15 minutes
const connectionLimiter = RateLimit({
	windowMs: 15 * 60 * 1000,
	max: async (request) => {
		if (getIP(request) == '86.25.177.233') return 0;
		else return 100;
	},
	message: 'You are accessing web pages too fast.',
});

// Only 5 API connections an hour
const apiLimiter = RateLimit({
	windowMs: 60 * 60 * 1000,
	max: 5,
	message: 'You are editing your profile too much',
});


// Only allow to send 2 feedback a day
module.exports = { createAccountLimiter, connectionLimiter, apiLimiter };
