const config = {
	// The domain of the website
	domain: 'URL',
	// the database for storing user info
	MongoDBURl: 'mongodb://localhost:27017/filesharer',
	// Allows people to login in via twitter
	twitter: {
		consumer_key:	'',
		consumer_secret:	'',
		access_token_key:	'',
		access_token_secret: '',
	},
	// Allows people to login in via facebook
	facebook: {
		clientID: '',
		clientSecret: '',
		callbackURL: '',
		profileURL: '',
		profileFields: ['id', 'email', 'name'],
	},
	// Allows people to login in via google
	google: {
		clientID: '',
		clientSecret: '',
	},
	// What domains should be allowed to be viewed via an iframe
	frame_domains: ['https://www.youtube.com/'],
	// This is the email that will send out verification emails to new users
	emailAuth: {
		user: 'EMAIL_ADDRESS',
		pass: 'PASSWORD',
	},
};

module.exports = config;
