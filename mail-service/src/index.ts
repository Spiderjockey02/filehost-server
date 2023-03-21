import nodemailer from 'nodemailer';
import express from 'express';
import config from './config';
import Logger from './Logger';
const app = express();

// Run mail service
(async () => {
	const smtpTransport = nodemailer.createTransport({
		host: config.emailAuth.host,
		secure: true,
		auth: {
			user: config.emailAuth.email,
			pass: config.emailAuth.pass,
		},
	});

	// Verifying the Nodemailer Transport instance
	smtpTransport.verify((error) => {
		console.log('error', error);
		if (error !== null) return Logger.log(error?.message, 'error');
		Logger.debug(`Ready to send emails from: ${config.emailAuth.email}`);
	});

	app
		// URL/verify?email=EMAIL_ADDRESS&ID=USER_ID
		.use(express.json())
		.use('/', (await import('./router/index')).default(smtpTransport))
		.listen(config.port, () => Logger.log(`Mail service online (port: ${config.port})`, 'ready'));
})();
