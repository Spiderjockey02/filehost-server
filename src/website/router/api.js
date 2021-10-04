const express = require('express'),
	{ post } = require('axios'),
	{ validate } = require('deep-email-validator'),
	{ FeedbackSchema, UserSchema } = require('../../models'),
	{ logger } = require('../../utils'),
	{ get } = require('axios'),
	fs = require('fs'),
	location = process.cwd() + '/src/website/files/',
	router = express.Router();

// Create paypal connection
// paypal.configure({
// 'mode': 'sandbox',
// 'client_id': 'AdPcJ6iZrHdUBiOzEQKFCkf-EbCbrqj6xiyOctRntYdZmDWWC2oyl3W_mwoqWmbfgKjvN2rG5Mmvaz5j',
// 'client_secret': 'EDEjhZJ5j1L2nnswluXKnn3fOF2mqUgmG28gc-6ycazUpPmjzO4fXCp2s_VQGTtWdHidtGORX8XGmXMi',
// });

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


router.post('/pay', async (req, res) => {
	const t = await get('https://api-m.sandbox.paypal.com/v1/billing/plans', {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Basic ${'AdPcJ6iZrHdUBiOzEQKFCkf-EbCbrqj6xiyOctRntYdZmDWWC2oyl3W_mwoqWmbfgKjvN2rG5Mmvaz5j'}:${'EDEjhZJ5j1L2nnswluXKnn3fOF2mqUgmG28gc-6ycazUpPmjzO4fXCp2s_VQGTtWdHidtGORX8XGmXMi'}`,
		},
	});
	console.log(t);
});
// Update user settings - password, avatar, re-sending verification emails

// Get files - This endpoint will be used for caching aswell (on file upload add optin for cache override meaning cache will be force fetched)
module.exports = router;
