import { BaseSyntheticEvent, useEffect, useState } from 'react';
import type { ResetPasswordFormError } from '@/types/errors';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { useSearchParams } from 'next/navigation';
import { Card, InputField } from '@/components';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import API from '@/services/api';
import Head from 'next/head';
import Link from 'next/link';

export default function ResetPasswordPage() {
	const [errors, setErrors] = useState<ResetPasswordFormError[]>([]);
	const [passwords, setPasswords] = useState({
		newPassword: '',
		repeatNewPassword: '',
	});
	const router = useRouter();
	const { showToast } = useToast();

	// Get the auth token to reset the user's password
	const searchParams = useSearchParams();
	const token = searchParams.get('token');

	async function resetPassword(e: BaseSyntheticEvent) {
		e.preventDefault();

		// Ensure password fields were entered
		const localErrors: ResetPasswordFormError[] = [];
		if (passwords.newPassword.length == 0) localErrors.push({ type: 'pwd1', message: 'This field is missing.' });
		if (passwords.repeatNewPassword.length == 0) localErrors.push({ type: 'pwd2', message: 'This field is missing.' });
		if (localErrors.length > 0) return setErrors(localErrors);
		if (token == null) return setErrors([{ type: 'misc', message: 'Password reset token is missing.' }]);

		try {
			// Send request to reset password
			const { data, error } = await authClient.resetPassword({
				newPassword: passwords.newPassword, token,
			});

			if (error) return setErrors([{ type: 'misc', message: `${error.message}` }]);
			if (data?.status) return router.push('/login');
		} catch (err) {
			console.log(err);
			setErrors([{ type: 'misc', message: `${err}` }]);
		}
	}

	useEffect(() => {
		const error = errors.find((e) => e.type === 'misc');
		if (error) showToast('error', error.message);
	}, [errors]);

	return (
		<>
			<Head>
				<title>{`${process.env.NEXT_PUBLIC_COMPANY_NAME} - Reset Password`}</title>
			</Head>
			<section className="d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
				<Card className="shadow-sm border-0" style={{ maxWidth: '420px', width: '100%' }}>
					<Card.Body className="p-4">
						<h3 className="fw-bold text-center mb-3">Reset Password</h3>
						<p className="text-muted text-center mb-4">
							Enter your new password below.
						</p>
						<form onSubmit={resetPassword}>
							<InputField title="New Password" name="new-password" autocomplete="new-password" type="password" onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} errorMsg={errors.find((e) => e.type === 'pwd1')?.message} />
							<InputField title="Repeat Password" name="repeat-password" autocomplete="new-password" type="password" onChange={(e) => setPasswords((p) => ({ ...p, repeatNewPassword: e.target.value }))} errorMsg={errors.find((e) => e.type === 'pwd2')?.message} />
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
	const data = await API.SESSION.fetchCurrentSession(context.req.headers.cookie || '');
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