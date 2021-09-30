const express = require('express'),
	{ UserSchema, FeedbackSchema } = require('../../models'),
	{ logger } = require('../../utils'),
	{ mailService } = require('../../config'),
	fs = require('fs'),
	router = express.Router();

module.exports = (smtpTransport) => {
	router.get('/verify', async (req, res) => {
		try {
			const user = await UserSchema.findOne({ _id: req.query.ID });
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
	});

	router.get('/verifed', async (req, res) => {
		try {
			const user = await UserSchema.findOne({ _id: req.query.ID });
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
	});

	router.post('/feedback', async ({ body: { data } }, res) => {
		// get html to send to user
		const verifyHTML = fs.readFileSync('./src/mailservice/assets/feedback.html', 'utf8')
			.replace(/\{\{NAME\}\}/g, data.name);

		try {
			// update database
			const feedback = new FeedbackSchema({
				name: data.name,
				email: data.email,
				feedback: data.message,
			});
			await feedback.save();

			// send email
			await smtpTransport.sendMail({
				to: data.email,
				subject: 'Thank you for your feedback',
				html: `${verifyHTML}`,
			});
			res.json({ success: 'Email sent' });
		} catch (err) {
			logger.log(err.mesage, 'error');
		}
	});

	return router;
};
