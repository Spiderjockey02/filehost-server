const { company } = require('../../config');

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
			if (company.devs.includes(req.user._id.toString())) {
				return next();
			} else {
				res.status(403)
					.render('403-page.ejs', {
						user: req.isAuthenticated() ? req.user : null,
						company,
					});
			}
		} else {
			return res
				.status(302)
				.redirect('/login');
		}
	},
};
