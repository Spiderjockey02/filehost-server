import { Card, ErrorPopup, InputField } from '@/components';
import type { GetServerSidePropsContext } from 'next';
import { useSearchParams } from 'next/navigation';
import { SettingErrorTypes } from '@/types';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import { BaseSyntheticEvent, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ResetPasswordPage() {
	const [passwords, setPasswords] = useState({
		newPassword: '',
		repeatNewPassword: '',
	});
	const router = useRouter();
	const [errors, setErrors] = useState<SettingErrorTypes[]>([]);

	// Get the auth token to reset the user's password
	const searchParams = useSearchParams();
	const token = searchParams.get('token');

	async function resetPassword(event: BaseSyntheticEvent) {
		event.preventDefault();

		// Ensure password fields were entered
		const localErrors: SettingErrorTypes[] = [];
		if (passwords.newPassword.length == 0) localErrors.push({ type: 'pwd1', text: 'This field is missing.' });
		if (passwords.repeatNewPassword.length == 0) localErrors.push({ type: 'pwd2', text: 'This field is missing.' });
		if (localErrors.length > 0) return setErrors(localErrors);
		if (token == null) return setErrors([{ type: 'misc', text: 'Password reset token is missing.' }]);

		try {
			// Send request to reset password
			const { data, error } = await authClient.resetPassword({
				newPassword: passwords.newPassword, token,
			});

			if (error) return setErrors([{ type: 'misc', text: `${error.message}` }]);
			if (data?.status) return router.push('/login');
		} catch (err) {
			console.log(err);
			setErrors([{ type: 'misc', text: `${err}` }]);
		}
	}

	return (
		<>
			<Head>
				<title>{`${process.env.NEXT_PUBLIC_COMPANY_NAME} - Reset Password`}</title>
			</Head>
			<section className="d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
				{errors.find((e) => e.type === 'misc') && (
					<ErrorPopup text={errors.find((e) => e.type === 'misc')!.text} />
				)}
				<Card className="shadow-sm border-0" style={{ maxWidth: '420px', width: '100%' }}>
					<Card.Body className="p-4">
						<h3 className="fw-bold text-center mb-3">Reset Password</h3>
						<p className="text-muted text-center mb-4">
							Enter your new password below.
						</p>

						<form onSubmit={resetPassword}>
							<InputField title="New Password" name="new-password" autocomplete="new-password" type="password" onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} errorMsg={errors.find((e) => e.type === 'pwd1')?.text} />
							<InputField title="Repeat Password" name="repeat-password" autocomplete="new-password" type="password" onChange={(e) => setPasswords((p) => ({ ...p, repeatNewPassword: e.target.value }))} errorMsg={errors.find((e) => e.type === 'pwd2')?.text} />
							<button type="submit" className="btn btn-primary w-100 mt-2 py-2 fw-semibold">
								Save Changes
							</button>
							<div className="text-center mt-3">
								<Link type="button" className="btn btn-link text-decoration-none p-0" href="/login">
									Back to Login
								</Link>
							</div>
						</form>
					</Card.Body>
				</Card>
			</section>
		</>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
		headers: {
			cookie: context.req.headers.cookie || '',
		},
	});

	const data = await res.json();
	if (data !== null) {
		return {
			redirect: {
				destination: '/files',
				permanent: false,
			},
		};
	} else {
		return { props: { } };
	}
}