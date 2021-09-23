const nodemailer = require('nodemailer'),
	express = require('express'),
	User = require('../models/user'),
	app = express();

// Run mail service
module.exports = async () => {
	const smtpTransport = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		auth: require('../config').emailAuth,
	});
	// Verifying the Nodemailer Transport instance
	smtpTransport.verify((error) => {
		console.log(error ?? 'Server is ready to take messages');
	});
	app
		// URL/verify?email=EMAIL_ADDRESS&ID=USER_ID
		.get('/verify', async (req, res) => {
			console.log(`Verifing ${req.query.email}`);
			const link = `http://localhost:1500/verifed?ID=${req.query.ID}`;
			const mailOptions = {
				to: req.query.email,
				subject: 'Please confirm your Email account',
				html: 'Hello,<br> Please Click on the link to verify your email.<br><a href=' + link + '>Click here to verify</a>',
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
		})
		.get('/verifed', async (req, res) => {
			try {
				const user = await User.findOne({ _id: req.query.ID });
				if (!user) return res.send('Incorrect ID');
				if (user.verified) return res.send('This email is already verified');
				user.verified = true;
				await user.save();
				res.send('Successfully verified email');
			} catch (err) {
				console.log(err);
				res.send(err.message);
			}
			console.log(res);
		}).listen(1500, () => 'mail service online');
};
