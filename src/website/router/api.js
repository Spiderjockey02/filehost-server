const express = require('express'),
	{ post } = require('axios'),
	{ validate } = require('deep-email-validator'),
	{ FeedbackSchema } = require('../../models'),
	{ logger } = require('../../utils'),
	router = express.Router();

// Recieve and save feedback to database and acknowledge system admins
router.post('/feedback', async (req, res) => {
	// Make sure email is valid
	const resp = await validate({ email: req.body.email, validateSMTP: false });
	if (!resp.valid) return res.redirect(`/contact-us?error=Invalid email&name=${req.body.name}&email=${req.body.email}`);

	// make sure they haven't already sent a feedback
	const feedback = await FeedbackSchema.findOne({ email: req.body.email });
	if (feedback) return res.redirect('/contact-us?error=You have already sent us feedback in the last week.');

	// Send data to mail service so person can be emailed
	try {
		await post(`${require('../../config').mailService.domain}/feedback`, {
			data: req.body,
		});
	} catch (err) {
		logger.log(err.message, 'error');
	}
	res.redirect('/contact-us');
});

// Update user settings - password, avatar, re-sending verification emails

// Get files - This endpoint will be used for caching aswell (on file upload add optin for cache override meaning cache will be force fetched)
module.exports = router;
