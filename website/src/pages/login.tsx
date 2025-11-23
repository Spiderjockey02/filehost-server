import { faDiscord, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LoginForm from '@/components/Form/LoginForm';
import { GetServerSidePropsContext } from 'next';
import { useEffect, useState } from 'react';
import { authClient } from '@/auth/client';
import { Card } from '@/components';
import Link from 'next/link';
import Head from 'next/head';

export default function SignIn() {
	// Get last used login method
	const [lastMethod, setLastMethod] = useState<null | string>(null);
	useEffect(() => {
		const method = authClient.getLastUsedLoginMethod();
		setLastMethod(method);
	}, []);

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
					<div className="row d-flex justify-content-center align-items-center h-100">
						<div className="col-lg-8 col-xl-7">
							<div className="d-flex justify-content-center align-items-center vh-100">
								<Card className='w-100'>
									<Card.Body className='d-flex flex-column align-items-center'>
										<h1 className="h1 fw-bold mb-4">Login</h1>
										<LoginForm />
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