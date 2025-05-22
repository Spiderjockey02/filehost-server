import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Card, ErrorPopup, InputField } from '@/components';
import type { BaseSyntheticEvent } from 'react';
import { authClient } from '@/auth/client';
import { LoginErrorTypes } from '@/types';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';

export default function SignIn() {
	const [errors, setErrors] = useState<LoginErrorTypes[]>([]);
	const [user, setUser] = useState({
		email: '',
		password: '',
	});
	const router = useRouter();
	const { callbackUrl } = router.query;

	const handleSubmit = async (event: BaseSyntheticEvent) => {
		event.preventDefault();
		const err = [] as LoginErrorTypes[];

		// Make sure both fields are filled in
		if (user.email.length == 0) err.push({ type: 'email', message: 'This field is missing.' });
		if (user.password.length == 0) err.push({ type: 'password', message: 'This field is missing.' });

		// Show errors if there are any
		if (err.length !== 0) return setErrors(err);

		// Try and sign in the user
		const { error } = await authClient.signIn.email({
			callbackURL: `${callbackUrl ?? window.location.origin}`,
			email: user.email,
			password: user.password,
		});

		// Show errors if any
		if (error) {
			if (error.message == 'Invalid username or password.') {
				return setErrors([
					{ type: 'password', message: error.message }, { type: 'email', message: error.message },
				]);
			}
			return setErrors([{ type: 'misc', message: 'Failed to login.' }]);
		}
	};

	return (
		<>
			<Head>
				<title>{process.env.NEXT_PUBLIC_COMPANY_NAME} - Login</title>
			</Head>
			<section className='d-flex flex-row align-items-center' style={{ 'backgroundColor': '#eee', padding: '0', minHeight: '100vh' }}>
				<div className="container h-100">
					{errors.find(e => e.type == 'misc') && (
						<ErrorPopup text={`${errors.find(e => e.type == 'misc')?.message}`} onClose={() => setErrors([])}/>
					)}
					<div className="row d-flex justify-content-center align-items-center h-100">
						<div className="col-lg-8 col-xl-7">
							<div className="d-flex justify-content-center align-items-center vh-100">
								<Card className='w-100'>
									<Card.Body className='d-flex flex-column align-items-center'>
										<h1 className="h1 fw-bold mb-4">Login</h1>
										<form className="w-100" onSubmit={handleSubmit}>
											<div className="mb-3 w-100">
												<InputField title='Email' type="email" name='email' onChange={(e) => setUser(u => ({ ...u, email: e.target.value }))} errorMsg={errors.find(e => e.type == 'email')?.message} />
											</div>
											<div className="mb-3 w-100">
												<InputField title='Password' type="password" name='password' autocomplete='current-password' onChange={(e) => setUser(u => ({ ...u, password: e.target.value }))} errorMsg={errors.find(e => e.type == 'password')?.message} />
											</div>
											<div className="d-flex justify-content-center mb-3">
												<button type="submit" className="btn btn-primary btn-lg">Login</button>
											</div>
											<p className="text-center">Need an account? <Link href="/register">Register</Link></p>
										</form>
										<div className="d-flex justify-content-around w-100">
											<button className='btn btn-secondary' type="submit" onClick={async () => {
												await authClient.signIn.social({
													provider: 'discord',
												});
											}}>
												<FontAwesomeIcon icon={faDiscord}/> Discord
											</button>
										</div>
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
		// Get the path from the URL
		const path = [context.params?.files].flat();
		return { props: { path: path.join('/') } };
	}
}