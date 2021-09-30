const { Schema, model } = require('mongoose');

const FeedbackSchema = new Schema({
	name: String,
	email: String,
	feedback: String,
	creationDate: { type: Date, default: Date.now },
});

const User = model('feedback', FeedbackSchema);

module.exports = User;
