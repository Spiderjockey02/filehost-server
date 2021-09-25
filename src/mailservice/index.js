const nodemailer = require('nodemailer'),
	express = require('express'),
	User = require('../models/user'),
	{ mailService } = require('../config'),
	{ logger } = require('../utils'),
	fs = require('fs'),
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
		.get('/verify', async (req, res) => {
			try {
				const user = await User.findOne({ _id: req.query.ID });
				if (user?.verified) return res.end('User is already verified');

				// get html to send to user
				const verifyHTML = fs.readFileSync('./src/mailservice/assets/link.html', 'utf8')
					.replace(/\{\{LINK\}\}/g, `${mailService.domain}/verifed?ID=${req.query.ID}`);

				const mailOptions = {
					to: req.query.email,
					subject: 'Please confirm your Email address',
					html: `${verifyHTML}`,
				};
				try {
					const resp = await smtpTransport.sendMail(mailOptions);
					console.log(resp);
					console.log('Message sent: ' + resp.message);
					res.end('sent');
				} catch (err) {
					console.log(err);
					res.end('error');
				}
			} catch (e) {
				console.log(e);
			}
		})
		.get('/verifed', async (req, res) => {
			try {
				const user = await User.findOne({ _id: req.query.ID });
				if (!user) return res.send('Incorrect ID');
				if (user.verified) return res.send('This email is already verified');
				user.verified = true;
				await user.save();
				res.redirect(`${require('../config').domain}/login`);
				console.log(`Verified ${user.email}`);
			} catch (err) {
				console.log(err);
				res.send(err.message);
			}
		})
		.listen(mailService.port, () => logger.log(`Mail service online (port: ${mailService.port})`, 'ready'));
};
