const express = require('express'),
	User = require('../../models/user'),
	router = express.Router();

router.get('/', async (req, res) => {
	const users = await User.find();
	console.log(users);
	res.render('admin/index', {
		data: users.map(user => ({
			label,
		})),
		data: {
			labels: ['Africa', 'Asia', 'Europe', 'Latin America', 'North America'],
			datasets: [{
				label: 'Population (millions)',
				backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'],
				data: [2478, 5267, 734, 784, 433],
			}] },
	});
});

module.exports = router;
