const express = require('express'),
	{ post } = require('axios'),
	{ validate } = require('deep-email-validator'),
	{ FeedbackSchema, UserSchema } = require('../../models'),
	{ apiLimiter } = require('../config/RateLimit'),
	{ logger } = require('../../utils'),
	fs = require('fs'),
	location = process.cwd() + '/src/website/files/userContent/',
	router = express.Router();

// Recieve and save feedback to database and acknowledge system admins
router.post('/feedback', apiLimiter, async (req, res) => {
	// Make sure email is valid
	const { valid } = await validate({ email: req.body.email, validateSMTP: false });
	if (!valid) {
		req.flash('name', req.body.name);
		req.flash('email', req.body.email);
		req.flash('error', 'Invalid email');
		return res.redirect('/contact-us');
	}

	// Check if they have already send a feedback within the last week
	const feedback = await FeedbackSchema.find({ email: req.body.email });
	if (feedback[0]) {
		// As people can send multipy feedback, find the latest feedback and check if that was over a week ago
		const latestFeedback = feedback.reduce((prev, current) => (prev.creationDate > current.creationDate) ? prev : current);
		if (Date.now() - latestFeedback.creationDate <= 604800000) {
			req.flash('error', 'You have already sent us feedback in the last week.');
			return res.redirect('/contact-us');
		}
	}

	// Send data to mail service so person can be emailed
	try {
		const resp = await post(`${require('../../config').mailService.domain}/feedback`, {
			data: req.body,
		});
		if (resp.error) console.log(resp.error);
	} catch (err) {
		req.flash('error', 'Unable to save feedback, please try again later.');
		res.redirect('/contact-us');
		return logger.log(err.message, 'error');
	}
	req.flash('success', 'Feedback successfully sent');
	res.redirect('/contact-us');
});

// Edit account (delete, reset password, change tier)
router.post('/account/:endpoint', apiLimiter, async (req, res) => {
	const endpoint = req.params.endpoint;
	const userID = req.body.custId;
	try {
		switch (endpoint) {
		case 'delete':
			// delete user from database and all their files
			await UserSchema.findOneAndDelete({ _id: userID });
			await fs.rmdirSync(location + userID, { recursive: true });
			req.flash('success', `Deleted ${userID}'s account`);
			res.redirect('/admin/users');
			break;
		case 'reset':
			// set password to empty & email user to update password
			await UserSchema.findOneAndUpdate({ _id: userID }, { password: '' });
			req.flash('success', `${userID}'s password has been reset.`);
			res.redirect('/admin/users');
			break;
		case 'tier':
			// set password to empty & email user to update password
			await UserSchema.findOneAndUpdate({ _id: userID }, { group: req.body.tier });
			req.flash('success', `Changed ${userID}'s tier to ${req.body.tier}.`);
			res.redirect('/admin/users');
			break;
		case 'email': {
			// Send verify email to user again
			const user = await UserSchema.findOne({ _id: userID });
			await require('axios').get(`${require('../../config').mailService.domain}/verify?email=${user.email}&ID=${userID}`);
			break;
		}
		default:
			req.flash('error', 'An unexpected error occured');
			res.redirect('/admin/users');
		}
	} catch (err) {
		logger.log(err.message, 'error');
		req.flash('error', err.message);
		res.redirect('/admin/users');
	}
});

// Get files - This endpoint will be used for caching aswell (on file upload add optin for cache override meaning cache will be force fetched)
module.exports = router;
