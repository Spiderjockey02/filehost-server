const config = {
	// The domain of the website
	domain: 'URL',
	// port the server will run on
	port: 1111,
	// the database for storing user info
	MongoDBURl: 'mongodb://localhost:27017/filesharer',
	twitter: {
		consumer_key:	'',
		consumer_secret:	'',
		access_token_key:	'',
		access_token_secret: '',
	},
	facebook: {
		clientID: '',
		clientSecret: '',
		callbackURL: '',
		profileURL: '',
		profileFields: ['id', 'email', 'name'],
	},
	google: {
		clientID: '',
		clientSecret: '',
	},
};

module.exports = config;
