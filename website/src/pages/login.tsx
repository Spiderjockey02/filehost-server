import { useState } from 'react';
import type { BaseSyntheticEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import type { SignInResponse } from 'next-auth/react';
import Link from 'next/link';
type resCode = 'Signin' | 'OAuthSignin' | 'OAuthCallback' |'OAuthCreateAccount' |'EmailCreateAccount' |'Callback' |'OAuthAccountNotLinked' |'EmailSignin' |'CredentialsSignin' |'default'

const errorsCodes = {
	'Signin': 'Try signing with a different account.',
	'OAuthSignin': 'Try signing with a different account.',
	'OAuthCallback': 'Try signing with a different account.',
	'OAuthCreateAccount': 'Try signing with a different account.',
	'EmailCreateAccount': 'Try signing with a different account.',
	'Callback': 'Try signing with a different account.',
	'OAuthAccountNotLinked': 'To confirm your identity, sign in with the same account you used originally.',
	'EmailSignin': 'Check your email address.',
	'CredentialsSignin': 'Sign in failed. Check the details you provided are correct.',
	'default': 'Unable to sign in.',
};

type ErrorTypes = {
 type: | 'email' | 'password'
 error: string
}

export default function SignIn() {
	const [errors, setErrors] = useState<ErrorTypes[]>([]);
	const router = useRouter();

	const handleSubmit = async (event: BaseSyntheticEvent) => {
		const err = [] as ErrorTypes[];
		event.preventDefault();
		const email = (document.getElementById('email') as HTMLInputElement).value;
		const password = (document.getElementById('password') as HTMLInputElement).value;

		// Make sure both fields are filled in
		if (email.length == 0) err.push({ type: 'email', error: 'This field is missing' });
		if (password.length == 0) err.push({ type: 'password', error: 'This field is missing' });

		// Show errors if there are any
		if (err.length !== 0) return setErrors(err);
		// Try and sign in the user
		const res = await signIn('credentials', {
			redirect: false,
			email: email,
			password: password,
			callbackUrl: `${window.location.search.split('=')[1]}`,
		}) as SignInResponse;


		// Show errors if any
		if (res.error) return setErrors([{ type: 'email', error: errorsCodes[res.error as resCode] }]);

		// Move to the callback URL so user knows they are logged in
		router.push(res.url as string);
	};


	return (
		<>
			<section className="vh-100" style={{ 'backgroundColor': '#eee' }}>
				<div className="container h-100">
					<div className="row d-flex justify-content-center align-items-center h-100">
						<div className="col-lg-8 col-xl-7">
							<div className="card text-black" style={{ 'borderRadius': '25px' }}>
								<div className="card-body p-md-5">
									<div className="row justify-content-center">
										<div className="col-md-12 col-lg-9 col-xl-8 order-2 order-lg-1">
											<p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Login</p>
											<form className="mx-1 mx-md-4" onSubmit={handleSubmit}>
												<div className="d-flex flex-row align-items-center mb-4">
													<i className="fas fa-envelope fa-lg me-3 fa-fw"></i>
													<div className="form-outline flex-fill mb-0">
														{errors.find(i => i.type == 'email') ?
															<label className="form-label text-danger" htmlFor="email">Email -{errors.find(i => i.type == 'email')?.error}</label>
															: <label className="form-label" htmlFor="email">Email</label>
														}
														<input type="text" id="email" className="form-control" name="email"/>
													</div>
												</div>

												<div className="d-flex flex-row align-items-center mb-4">
													<i className="fas fa-envelope fa-lg me-3 fa-fw"></i>
													<div className="form-outline flex-fill mb-0">
														{errors.find(i => i.type == 'password') ?
															<label className="form-label text-danger" htmlFor="password">Password - {errors.find(i => i.type == 'password')?.error}</label>
															: <label className="form-label" htmlFor="password">Password</label>
														}
														<input type="password" id="password" className="form-control" name="password" />
														<Link href='/forgot-password'>Forgot your password?</Link>
													</div>
												</div>

												<div className="d-flex justify-content-center mx-4 mb-3 mb-lg-4">
													<button type="submit" className="btn btn-primary btn-lg">Login</button>
												</div>
												<p>Need an account? <Link href="/register">Register</Link></p>
											</form>
										</div>
									</div>
									<form action="/api/auth/signin/twitter" method="post">
										<button type="submit"> Twitter</button>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
