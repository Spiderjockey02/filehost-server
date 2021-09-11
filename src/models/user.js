const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
	name: { type: String },
	email: { type: String },
	password: { type: String },
	date: { type: Date, default: Date.now },
});

const User = model('User', UserSchema);

module.exports = User;
