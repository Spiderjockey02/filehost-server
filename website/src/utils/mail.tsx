import { PasswordReset, NewDeviceSignin, PasswordChanged, VerifyEmail } from '../components/Emails';
import { renderToStaticMarkup } from 'react-dom/server';
import type { User } from 'better-auth/types';
import nodemailer from 'nodemailer';
import client from '../auth/prisma';
import EmailAttemptChange from '@/components/Emails/EmailAttemptChange';

// Set up the email transporter
const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_SERVER_HOST,
	port: Number(process.env.EMAIL_SERVER_PORT),
	secure: false,
	auth: {
		user: process.env.EMAIL_SERVER_USER,
		pass: process.env.EMAIL_SERVER_PASSWORD,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

async function createAuditLogEntry(user: User, success: boolean, message: string) {
	await client.auditLog.create({
		data: {
			event: {
				connectOrCreate: {
					where: {
						name: 'EMAIL_SENT',
					},
					create: {
						name: 'EMAIL_SENT',
						resourceType: 'EMAIL',
						displayName: 'Email Sent',
					},
				},
			},
			resourceId: user.id,
			user: {
				connect: {
					id: user.id,
				},
			},
			success, message,
		},
	});
}


async function sendEmailToUser(user: User, subject: string, textContent: string, htmlContent: string) {
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const mail = await transporter.sendMail({
				from: `"${process.env.NEXT_PUBLIC_COMPANY_NAME}" <${process.env.EMAIL_SERVER_USER}>`,
				to: user.email,
				subject: subject,
				text: textContent,
				html: htmlContent,
			});

			await createAuditLogEntry(user, true, `Email with subject "${subject}" sent.`);
			return mail;
		} catch (err) {
			if (attempt === 3) return createAuditLogEntry(user, false, `Failed to send email with subject "${subject}" due to ${err}.`);
			await new Promise(res => setTimeout(res, 300 * attempt));
		}
	}
}

/**
	* Send an email to the user notifying them of an attempted email address change
	* @param {User} user The user to send the email to
	* @param {string} newEmail The new email address attempted
	* @param {string} verifyURL The email verification URL
	* @returns The result of the email sending operation
*/
export async function sendEmailChangedAttemptEmail(user: User, newEmail: string, verifyURL: string) {
	const html = renderToStaticMarkup(<EmailAttemptChange oldEmail={user.email} newEmail={newEmail} verifyURL={verifyURL} />);

	return sendEmailToUser(user,
		'Email Address Change Attempted',
		`An attempt was made to change the email address associated with your account to ${newEmail}. If this was not you, please contact support immediately at ${process.env.SUPPORT_EMAIL || ''}.`,
		html,
	);
}

/**
	* Send an email to the user notifying them of a new device sign-in
	* @param {User} user The user to send the email to
	* @returns The result of the email sending operation
*/
export async function sendNewDeviceSignInEmail(user: User, details: { browser: string, OS: string, location: string, ip: string, time: Date}) {
	const html = renderToStaticMarkup(<NewDeviceSignin email={user.email} details={details} />);

	return sendEmailToUser(user,
		'New Device Sign-In Detected',
		`A new device has signed in to your account. If this was not you, please contact support immediately at ${process.env.SUPPORT_EMAIL || ''}.`,
		html,
	);
}

/**
	* Send an email to the user notifying them that their password has been changed
	* @param {User} user The user to send the email to
	* @returns The result of the email sending operation
*/
export async function sendPasswordChangedEmail(user: User) {
	const html = renderToStaticMarkup(<PasswordChanged email={user.email} />);

	return sendEmailToUser(user,
		'Your Password Has Been Changed',
		`Your password was changed on ${new Date().toLocaleString()}. If you did not authorize this change, please contact support immediately at ${process.env.SUPPORT_EMAIL || ''}.`,
		html,
	);
}

/**
	* Send an email to the user to reset their password
	* @param {User} user The user to send the email to
	* @param {string} resetPwdURL The password reset URL
	* @returns The result of the email sending operation
*/
export async function sendPasswordResetEmail(user: User, resetPwdURL: string) {
	const html = renderToStaticMarkup(<PasswordReset email={user.email} resetPwdURL={resetPwdURL} />);

	return sendEmailToUser(user,
		'Password Reset Request',
		`You can reset your password using the following link: ${resetPwdURL}`,
		html,
	);
}

/**
	* Send an email to the user to verify their email address
	* @param {User} user The user to send the email to
	* @param {string} confirmURL The email confirmation URL
	* @returns The result of the email sending operation
*/
export async function sendVerificationEmail(user: User, confirmURL: string) {
	const html = renderToStaticMarkup(<VerifyEmail email={user.email} confirmURL={confirmURL} />);

	return sendEmailToUser(user,
		'Verify Your Email Address',
		`Please verify your email address by clicking the following link: ${confirmURL}`,
		html,
	);
}