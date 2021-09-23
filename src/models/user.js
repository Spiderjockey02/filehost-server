const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
	name: String,
	email: String,
	password: String,
	creationDate: { type: Date, default: Date.now },
	recent: Array,
	favourites: Array,
	size: { type: String, default: '0' },
	verified: { type: Boolean, default: false },
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
