const RateLimit = require('express-rate-limit'),
	config = require('../../config'),
	MongoStore = require('rate-limit-mongo');

const limiter = new RateLimit({
	store: new MongoStore({
		uri: config.MongoDBURl,
		user: '',
		password: '',
		// should match windowMs
		expireTimeMs: 15 * 60 * 1000,
		errorHandler: console.error.bind(null, 'rate-limit-mongo'),
		// see Configuration section for more options and details
	}),
	max: 100,
	// should match expireTimeMs
	windowMs: 15 * 60 * 1000,
});

module.exports = limiter;
