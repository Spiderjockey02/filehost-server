import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { Card, ErrorPopup, InputField, SuccessPopup } from '@/components';
import type { BaseSyntheticEvent } from 'react';
import { authClient } from '@/auth/client';
import { LoginErrorTypes } from '@/types';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import User2FAInputModal from '@/components/Modals/User2FAInputModal';

export default function SignIn() {
	const modalRef = useRef<HTMLDivElement>(null);
	const [errors, setErrors] = useState<LoginErrorTypes[]>([]);
	const [success, setSuccess] = useState<null | string>(null);
	const [user, setUser] = useState({
		email: '',
		password: '',
	});
	const router = useRouter();
	const { callbackUrl } = router.query;

	// Get last used login method
	const [lastMethod, setLastMethod] = useState<null | string>(null);
	useEffect(() => {
		const method = authClient.getLastUsedLoginMethod();
		setLastMethod(method);
	}, []);

	const handleSubmit = async (event: BaseSyntheticEvent) => {
		event.preventDefault();
		const err = [] as LoginErrorTypes[];

		// Make sure both fields are filled in
		if (user.email.length == 0) err.push({ type: 'email', message: 'This field is missing.' });
		if (user.password.length == 0) err.push({ type: 'password', message: 'This field is missing.' });

		// Show errors if there are any
		if (err.length !== 0) return setErrors(err);

		// Try and sign in the user
		await authClient.signIn.email({
			callbackURL: `${callbackUrl ?? window.location.origin}`,
			email: user.email,
			password: user.password,
		}, {
			onSuccess: async (context) => {
				console.log(context);
				if (context.data.twoFactorRedirect) {
					const bootstrap = await import('bootstrap');
					const Modal = bootstrap.Modal;

					if (modalRef.current) {
						const modal = new Modal(modalRef.current);
						modal.show();
					}
				}
			},
			onError: ({ error: err }) => {
				switch (err.code) {
					case 'INVALID_EMAIL_OR_PASSWORD':
						return setErrors([
							{ type: 'password', message: err.message }, { type: 'email', message: err.message },
						]);
					case 'INVALID_EMAIL':
						return setErrors([
							{ type: 'email', message: 'We couldn\'t find an account with that email.' },
						]);
					default:
						setErrors([{ type: 'misc', message: 'Failed to login.' }]);
				}
			},
		});
	};

	async function resetPassword() {
		try {
			const { data, error } = await authClient.requestPasswordReset({
				email: user.email,
				redirectTo: '/reset-password',
			});

			if (error) throw error;
			if (data !== null) return setSuccess(data.message);
		} catch (err) {
			console.log(err);
			setErrors([{ type: 'misc', message: 'Failed to request password reset' }]);
		}
	}

	async function loginWithProvider(provider: 'google' | 'discord') {
		await authClient.signIn.social({
			provider,
		});
	}

	return (
		<>
			<Head>
				<title>{`${process.env.NEXT_PUBLIC_COMPANY_NAME} - Login`}</title>
			</Head>
			<section className='d-flex flex-row align-items-center' style={{ 'backgroundColor': '#eee', padding: '0', minHeight: '100vh' }}>
				<div className="container h-100">
					{errors.find(e => e.type == 'misc') && (
						<ErrorPopup text={`${errors.find(e => e.type == 'misc')?.message}`} />
					)}
					{success !== null && <SuccessPopup text={success} />}
					<User2FAInputModal modalRef={modalRef} />
					<div className="row d-flex justify-content-center align-items-center h-100">
						<div className="col-lg-8 col-xl-7">
							<div className="d-flex justify-content-center align-items-center vh-100">
								<Card className='w-100'>
									<Card.Body className='d-flex flex-column align-items-center'>
										<h1 className="h1 fw-bold mb-4">Login</h1>
										<form className="w-100" onSubmit={handleSubmit}>
											<div className="mb-3 w-100">
												<InputField title='Email' type="email" name='email' onChange={(e) => setUser(u => ({ ...u, email: e.target.value }))} errorMsg={errors.find(e => e.type == 'email')?.message} />
												<InputField title='Password' type="password" name='password' autocomplete='current-password' onChange={(e) => setUser(u => ({ ...u, password: e.target.value }))} errorMsg={errors.find(e => e.type == 'password')?.message} />
											</div>
											{errors.find((e) => e.type === 'password') && (
												<div className="text-end">
													<button type="button" onClick={resetPassword} className="btn btn-link p-0 text-decoration-none" style={{ fontSize: '0.9rem' }}>
														Forgot password?
													</button>
												</div>
											)}
											<div className="d-flex justify-content-center mb-3">
												<button type="submit" className="btn btn-primary btn-md">Continue</button>
											</div>
											<div className="d-flex align-items-center my-3 text-secondary">
												<hr className="flex-grow-1" />
												<span className="px-2">OR</span>
												<hr className="flex-grow-1" />
											</div>
										</form>
										<div className="d-grid gap-2 mb-2">
											<button className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 py-2 position-relative" onClick={() => loginWithProvider('google')}>
												<FontAwesomeIcon icon={faGoogle}/>
    										Continue with Google
												{lastMethod == 'google' && (
													<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill"style={{ backgroundColor: 'rgba(80, 80, 80, 0.85)', color: 'lightgrey', fontSize: '0.75rem', backdropFilter: 'blur(2px)' }}>
          									Last used
														<span className="visually-hidden">last used provider</span>
													</span>
												)}
											</button>
											<button className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 py-2 position-relative" onClick={() => loginWithProvider('discord')}>
												<FontAwesomeIcon icon={faDiscord}/>
    										Continue with Discord
												{lastMethod == 'discord' && (
													<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill"style={{ backgroundColor: 'rgba(80, 80, 80, 0.85)', color: 'lightgrey', fontSize: '0.75rem', backdropFilter: 'blur(2px)' }}>
          									Last used
														<span className="visually-hidden">last used provider</span>
													</span>
												)}
											</button>
										</div>
										<p className="text-center">Don&apos;t have an account? <Link href="/register">Sign up</Link></p>
									</Card.Body>
								</Card>
							</div>
						</div>
					</div>
				</div>
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