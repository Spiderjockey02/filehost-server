const express = require('express'),
	{ UserSchema } = require('../../models'),
	{ checkDev } = require('../config/auth'),
	router = express.Router();

router.get('/', checkDev, async (req, res) => {
	const users = await UserSchema.find();
	console.log(users);
	res.render('admin/index', {
		data: {
			labels: users.map(user => user._id ?? 'missing'),
			datasets: [{
				label: 'Data storage per a user',
				backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c458500', '#3e95cd', '#8e5ea2', '#3cba9f'],
				data: users.map(user => user.size ?? 0),
			}],
		},
	});
});

module.exports = router;
