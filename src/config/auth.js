module.exports = {
	// Check if user is logged in
	ensureAuthenticated : function(req, res, next) {
		if (req.isAuthenticated()) return next();
		res.redirect('/login');
	},
};
