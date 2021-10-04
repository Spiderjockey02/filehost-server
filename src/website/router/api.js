const express = require('express'),
	{ post } = require('axios'),
	{ validate } = require('deep-email-validator'),
	{ FeedbackSchema, UserSchema } = require('../../models'),
	{ apiLimiter } = require('../config/RateLimit'),
	{ logger } = require('../../utils'),
	fs = require('fs'),
	location = process.cwd() + '/src/website/files/',
	router = express.Router();

// Recieve and save feedback to database and acknowledge system admins
router.post('/feedback', apiLimiter, async (req, res) => {
	// Make sure email is valid
	const { valid } = await validate({ email: req.body.email, validateSMTP: false });
	if (!valid) return res.redirect(`/contact-us?error=Invalid email&name=${req.body.name}&email=${req.body.email}`);

	// Check if they have already send a feedback within the last week
	const feedback = await FeedbackSchema.findOne({ email: req.body.email });
	if (Date.now() - feedback.creationDate <= 604800000) return res.redirect('/contact-us?error=You have already sent us feedback in the last week.');

	// Send data to mail service so person can be emailed
	try {
		const resp = await post(`${require('../../config').mailService.domain}/feedback`, {
			data: req.body,
		}).then(data => data.json());
		if (resp.error) console.log(resp.error);
	} catch (err) {
		res.redirect('/contact-us?error=Unable to save feedback, please try again later.');
		logger.log(err.message, 'error');
	}
	res.redirect('/contact-us');
});

// Delete an account
router.post('/account/:endpoint', apiLimiter, async (req, res) => {
	const endpoint = req.params.endpoint;
	const userID = req.body.custId;
	switch (endpoint) {
	case 'delete':
		try {
			// delete user from database and all their files
			await UserSchema.findOneAndDelete({ _id: userID });
			await fs.rmdirSync(location + userID, { recursive: true });
			res.redirect(`/admin/users?success=Deleted ${userID}'s account`);
		} catch (err) {
			logger.log(err.message, 'error');
			res.redirect(`/admin/users?error=${err.message}`);
		}
		break;
	case 'reset':
		try {
			// set password to empty & email user to update password
			await UserSchema.findOneAndUpdate({ _id: userID }, { password: '' });
			res.redirect(`/admin/users?success=Resetted ${userID}'s account`);
		} catch (err) {
			logger.log(err.message, 'error');
			res.redirect(`/admin/users?error=${err.message}`);
		}
		break;
	case 'tier':
		try {
			// set password to empty & email user to update password
			await UserSchema.findOneAndUpdate({ _id: userID }, { group: req.body.tier });
			res.redirect(`/admin/users?success=Changed ${userID}'s tier to ${req.body.tier}.`);
		} catch (err) {
			logger.log(err.message, 'error');
			res.redirect(`/admin/users?error=${err.message}`);
		}
		break;
	default:
		res.redirect('/admin/users?error=An error occured');
	}
});

// Get files - This endpoint will be used for caching aswell (on file upload add optin for cache override meaning cache will be force fetched)
module.exports = router;
