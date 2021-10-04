const express = require('express'),
	{ post } = require('axios'),
	{ validate } = require('deep-email-validator'),
	{ FeedbackSchema, UserSchema } = require('../../models'),
	{ logger } = require('../../utils'),
	fs = require('fs'),
	location = process.cwd() + '/src/website/files/',
	router = express.Router();

// Recieve and save feedback to database and acknowledge system admins
router.post('/feedback', async (req, res) => {
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
router.post('/account-delete/:ID', async (req, res) => {
	// try and delete account
	if (require('../../config').company.devs.includes(req.user.id)) {
		const userID = req.params.ID;
		console.log(userID);
		try {
			await UserSchema.findOneAndDelete({ _id: userID });
			await fs.rmdirSync(location + userID, { recursive: true });
			res.redirect(`/admin/users?success=Deleted ${userID} account`);
		} catch (err) {
			logger.log(err.message, 'error');
			res.redirect(`/admin/users?error=${err.message}`);
		}
	} else {
		res.status(401).json({ error: 'You do not have permission to do this.'	});
	}
});

// Update user settings - password, avatar, re-sending verification emails

// Get files - This endpoint will be used for caching aswell (on file upload add optin for cache override meaning cache will be force fetched)
module.exports = router;
