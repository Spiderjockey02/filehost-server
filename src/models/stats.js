const { Schema, model } = require('mongoose');

const StatSchema = new Schema({
	name: String,
	count: Number,
	daily: Number,
	weekly: Number,
	monthly: Number,
	yearly: Number,
	allTIme: Number,
});

const User = model('Stats', StatSchema);

module.exports = User;
