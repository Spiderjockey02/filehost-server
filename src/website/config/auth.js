module.exports = {
	// Check if user is logged in
	ensureAuthenticated : function(req, res, next) {
		if (req.isAuthenticated()) return next();
		res
			.status(302)
			.redirect('/login');
	},
};
