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
		user: req.isAuthenticated() ? req.user : null,
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
