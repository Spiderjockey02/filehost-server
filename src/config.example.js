const config = {
	// domain of your website
	domain: '',
	MongoDBURl: 'mongodb://localhost:27017/filesharer',
	// For verifing email addresses
	mailService: {
		enable: true,
		domain: '',
		port: 1500,
		emailAuth: {
			user: 'EMAIL',
			pass: 'PASSWORD',
		},
	},
	// For logging in via social media
	passport: {
		twitter: {
			consumer_key:	'',
			consumer_secret:	'',
			access_token_key:	'',
			access_token_secret: '',
		},
		facebook: {
			clientID: '',
			clientSecret: '',
			// replace DOMAIN with the domain your wrote above
			callbackURL: 'DOMAIN/auth/facebook/callback',
			profileURL: '',
			profileFields: ['id', 'email', 'name'],
		},
		google: {
			clientID: '',
			clientSecret: '',
		},
	},
	// Information about your project (for home page/footer etc)
	company: {
		name: 'Name of the project',
		slogan: 'A nice slogan for a nice company',
	},
	// what URL's to play in iframes for internet shortcut files
	frame_domains: ['https://www.youtube.com/'],
	// Should be HTTPS or not
	secure: true,
	// Extra information in console for debugging issues
	debug: true,
};

module.exports = config;
