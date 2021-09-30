const RateLimit = require('express-rate-limit');

// Only allow 5 accounts a day
const createAccountLimiter = RateLimit({
	windowMs: 24 * 60 * 60 * 1000,
	max: 5,
	message: 'Too many accounts created from this IP, please try again after an hour',
});

// General API limit
const apiLimiter = RateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
});

// Only allow to send 2 feedback a day
module.exports = { createAccountLimiter, apiLimiter };
