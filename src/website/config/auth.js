const config = require('../../config');

module.exports = {
	// Check if user is logged in
	ensureAuthenticated : function(req, res, next) {
		if (req.isAuthenticated()) return next();
		res
			.status(302)
			.redirect('/login');
	},
	checkDev: function(req, res, next) {
		if (req.isAuthenticated()) {
			if (config.company.devs.includes(req.user._id.toString())) {
				return next();
			}
			return res
				.status(302)
				.redirect('/login?error=Access denied');
		}
		res
			.status(302)
			.redirect('/login');
	},
};
