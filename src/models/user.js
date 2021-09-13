const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
	name: { type: String },
	email: { type: String },
	password: { type: String },
	creationDate: { type: Date, default: Date.now },
	recent: { type: Array },
	favourites: { type: Array },
});

const User = model('User', UserSchema);

module.exports = User;
