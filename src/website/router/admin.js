const express = require('express'),
	{ UserSchema, StatSchema, FeedbackSchema } = require('../../models'),
	{ checkDev } = require('../config/auth'),
	{ readdirSync } = require('fs'),
	location = process.cwd() + '/src/website/files/userContent/',
	{ post } = require('axios'),
	checkDiskSpace = require('check-disk-space').default,
	router = express.Router();

router.get('/', checkDev, async (req, res) => {
	const users = await UserSchema.find(),
		files = require('../../utils/directory')(location);
	res.render('admin/index', {
		user: req.user,
		data: {
			labels: users.map(user => user._id ?? 'missing'),
			datasets: [{
				label: 'Data storage per a user',
				backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c458500', '#3e95cd', '#8e5ea2', '#3cba9f'],
				data: users.map(user => user.size ?? 0),
			}],
		},
		totalSize: await checkDiskSpace(location).then(disk => disk.size),
		formatBytes: require('../../utils').formatBytes,
		size: getTotalSize(files, 0),
		users,
	});
});

router.get('/users', checkDev, async (req, res) => {
	const users = await UserSchema.find(),
		files = require('../../utils/directory')(location),
		folders =	readdirSync(location, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory());

	res.render('admin/users', {
		user: req.isAuthenticated() ? req.user : null,
		// For showing user connection piechart
		userConnections: {
			labels: ['Google', 'Facebook', 'Twitter', 'Email'],
			datasets: [{
				backgroundColor: ['#ea4335', '#3b5998', '#1da1f2', '#99aab5'],
				data: [
					users.filter(user => user.google.id).length,
					users.filter(user => user.facebook.id).length,
					users.filter(user => user.twitter.id).length,
					users.filter(user => user.email).length,
				],
			}],
		},
		verification: {
			labels: ['Verified', 'Unverified'],
			datasets: [{
				backgroundColor: ['#03fc62', '#fc035e'],
				data: [users.filter(user => user.verified).length, users.filter(user => !user.verified).length],
			}],
		},
		totalSize: await checkDiskSpace(location).then(disk => disk.size),
		formatBytes: require('../../utils').formatBytes,
		size: getTotalSize(files, 0),
		error: req.query.error,
		success: req.query.success,
		users, folders,
	});
});

router.get('/analytics', checkDev, async (req, res) => {
	const zoneTag = 'fe8a28f0522e4e099dfa33eb76ba904b';
	const data = { 'query':'{\n  viewer {\n    zones(filter: { zoneTag: ' + zoneTag + ' }) {\n      httpRequests1dGroups(\n        orderBy: [date_ASC]\n        limit: 1000\n        filter: { date_gt: "2021-09-29" date_lt: "2021-10-05" }\n      ) {\n        date: dimensions {\n          date\n        }\n        sum {\n          cachedBytes\n          bytes\n        }\n      }\n    }\n  }\n}', 'variables':{} };
	const response = await post('https://api.cloudflare.com/client/v4/graphql', JSON.stringify(data), {
		headers: {
			'X-AUTH-EMAIL': 'USERNAME',
			'X-AUTH-KEY': 'AUTHKEY',
		},
	});
	const newData = response.data.data.viewer.zones[0].httpRequests1dGroups;
	const referralLinks = await StatSchema.find();
	res.render('admin/analytics', {
		user: req.isAuthenticated() ? req.user : null,
		formatBytes: require('../../utils').formatBytes,
		cachedData: {
			labels: newData.map(item => item.date.date),
			datasets: [{
				label: 'Bytes',
				borderColor: 'black',
				lineTension: 0,
				data: newData.map(item => item.sum.bytes),
			},
			{
				label: 'Cached Bytes',
				borderColor: 'black',
				lineTension: 0,
				data: newData.map(item => item.sum.cachedBytes),
			},
			],
		},
		ReferLinks: {
			labels: referralLinks.map(item => item.name),
			datasets: [
				{
					label: 'Clicked',
					data: referralLinks.map(item => item.count),
				},
			],
		},
	});
});

// Show all feedback from /contact-us
router.get('/feedback', checkDev, async (req, res) => {
	const feedback = await FeedbackSchema.find();
	res.render('admin/feedback', {
		user: req.isAuthenticated() ? req.user : null,
		feedback,
	});
});

module.exports = router;

function getTotalSize(n, num) {
	for (const file of n.children) {
		num = (file.type == 'directory') ? getTotalSize(file, num) : num + file.size;
	}
	return num;
}
