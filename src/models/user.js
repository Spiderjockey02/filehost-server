const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
	name: { type: String },
	email: { type: String },
	password: { type: String },
	creationDate: { type: Date, default: Date.now },
	recent: { type: Array },
	favourites: { type: Array },
	facebook: {
		id: String,
		token: String,
		name: String,
		email: String,
	},
	twitter: {
		id: String,
		token: String,
		displayName: String,
		username: String,
	},
	google: {
		id: String,
		token: String,
		email: String,
		name: String,
	},
});

const User = model('User', UserSchema);

module.exports = User;
