const nodemailer = require('nodemailer'),
	express = require('express'),
	{ mailService } = require('../config'),
	{ logger } = require('../utils'),
	app = express();

// Run mail service
module.exports = async () => {
	const smtpTransport = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		auth: mailService.emailAuth,
	});

	// Verifying the Nodemailer Transport instance
	smtpTransport.verify((error) => {
		if (error) logger.log(error?.message, 'error');
	});

	app
	// URL/verify?email=EMAIL_ADDRESS&ID=USER_ID
		.use(express.json())
		.use('/', require('./router')(smtpTransport))
		.listen(mailService.port, () => logger.log(`Mail service online (port: ${mailService.port})`, 'ready'));
};
