# Installation

The config file that needs to be edited (Must be rename to config.js):
```js
const config = {
	// The domain of the website
	domain: 'URL',
	// port the server will run on
	port: 1111,
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
};
```

* `domain`: The URl of the website people will connect to.
* `port`: The port the server will run (preferable 80 or 443).
* `MongoDBURl`: For storing user information.
* `twitter`: So people can log in using their twitter account.
* `facebook`: So people can log in using their facebook account.
* `google`: So people can log in using their google account.
* `frame_domains`: An array of domains accessible by an iframe. This can be achieved when a user uploads a .url file.

### Setting up the database
The database natively used is [MongoDB](https://www.mongodb.com/). So you will need to [create an account](https://www.mongodb.com/try) for this step.

* Once you have created an account navigate to the cluster page and create a free cluster.
* Next wait for the changes to be deployed (this could take upto 5 minutes) and click the `connect` button.
* Select the `Allow Access from Anywhere` button and then `Add Ip Address`.
* Create a `dbUser` and `dbUserPassword` and hold onto this for later.
* Navigate to `Choose a connection method` click `Connect your application` and copy the provided link.
* Navigate to `src/config.js` in your bot and replace the `mongodb://link`at the bottom with the link you have copied. **Make sure to replace `<password>` with the password you created** .

### Setting up twitter connection
* Navigate to this webpage https://developer.twitter.com/ and log in, once logged in select `Developer Portal` (top left of screen)
* Select `Projects & Apps` -> `Overview` and then click `Create App`.
* The name can whatever you want to name your project, and save your your keys somewhere for later use.
* On the settings page select `Authentication settings`, and then enable `Enable 3-legged OAuth`. Then input your callback URL which is `domain/auth/twitter/callback`.
* Once added click `Keys and Tokens` and get your `Access Token and Secret`. 
* Now go back to your config file and fill in your twitter details.


### Setting up facebook connection (Can not use an IP-based domain)
* Unknown for now as I currently only have an IP-based URL.

### Setting up google connection (Can not use an IP-based domain)
* Unknown for now as I currently only have an IP-based URL.
