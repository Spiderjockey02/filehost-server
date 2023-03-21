const config = {
	url: process.env.NEXTAUTH_URL,
	twitter: {
		consumer_key:	'',
		consumer_secret:	'',
		access_token_key:	'',
		access_token_secret: '',
	},
	facebook: {
		clientID: '',
		clientSecret: '',
		callbackURL: `${process.env.NEXTAUTH_URL}/auth/facebook/callback`,
		profileURL: 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
		profileFields: ['id', 'email', 'name'],
	},
	google: {
		clientID: '',
		clientSecret: '',
	},
	company: {
		name: '',
		slogan: '',
		devs: [''],
		email: '',
		phone: '',
		facebookURL: '',
		twitterURL: '',
		instagramURL: '',
		linkedinURL: '',
	},
};

export default config;
