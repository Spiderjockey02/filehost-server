import express from 'express';
import fs from 'fs';
import type { Transporter } from 'nodemailer';
import config from '../config';

// const express = require('express'),
//	{ UserSchema, FeedbackSchema } = require('../../models'),
//	{ logger } = require('../../utils'),
//	{ mailService, domain } = require('../../config'),
//	fs = require('fs'),
const	router = express.Router();

export default function(smtpTransport: Transporter) {
	router.get('/verify', async (req, res) => {
		try {
			/*
			const user = await UserSchema.findOne({ _id: req.query.ID });
			if (user?.verified) return res.end('User is already verified');
			*/

			// get html to send to user
			const verifyHTML = fs.readFileSync('./src/mailservice/assets/link.html', 'utf8')
				.replace(/\{\{LINK\}\}/g, `${config.domain}/verifed?ID=${req.query.ID}`);

			const mailOptions = {
				to: req.query.email as string,
				subject: 'Please confirm your Email address',
				html: `${verifyHTML}`,
			};
			try {
				const resp = smtpTransport.sendMail(mailOptions);
				console.log(resp);
				console.log('Message sent: ' + resp);
				res.end('sent');
			} catch (err) {
				console.log(err);
				res.end('error');
			}
		} catch (e) {
			console.log(e);
		}
	});

	router.get('/verifed', async (_req, res) => {
		try {
			/*
			const user = await UserSchema.findOne({ _id: req.query.ID });
			if (!user) return res.send('Incorrect ID');
			if (user.verified) return res.send('This email is already verified');
			user.verified = true;
			await user.save();
			*/
			res.redirect(`${config.domain}/login`);
			// console.log(`Verified ${user.email}`);
		} catch (err: any) {
			console.log(err);
			res.send(err.message);
		}
	});

	return router;
}
