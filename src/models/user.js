const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
	name: String,
	email: String,
	password: String,
	creationDate: { type: Date, default: Date.now },
	recent: Array,
	favourites: Array,
	shared: Array,
	size: { type: String, default: '0' },
	verified: { type: Boolean, default: false },
	group: { type: String, default: 'Free' },
	avatar: String,
	facebook: {
		id: String,
		token: String,
		email: String,
	},
	twitter: {
		id: String,
		token: String,
	},
	google: {
		id: String,
		token: String,
		email: String,
	},
});

const User = model('User', UserSchema);

module.exports = User;
