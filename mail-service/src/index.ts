import nodemailer from 'nodemailer';
import express from 'express';
import config from './config';
import Logger from './Logger';
const app = express();

// Run mail service
(async () => {
	const smtpTransport = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		auth: config.emailAuth,
	});

	// Verifying the Nodemailer Transport instance
	smtpTransport.verify((error) => {
		if (error) Logger.log(error?.message, 'error');
	});

	app
		// URL/verify?email=EMAIL_ADDRESS&ID=USER_ID
		.use(express.json())
		.use('/', (await import('./router/index')).default(smtpTransport))
		.listen(config.port, () => Logger.log(`Mail service online (port: ${config.port})`, 'ready'));
})();
