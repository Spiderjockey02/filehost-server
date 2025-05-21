import { GetServerSidePropsContext } from 'next/types';
import { Card, ErrorPopup, InputField } from '@/components';
import type { BaseSyntheticEvent } from 'react';
import { RegisterErrorTypes } from '@/types';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import { auth } from '@/auth/server';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';

export default function Register() {
	const [disabled, setDisabled] = useState(true);
	const [errors, setErrors] = useState<RegisterErrorTypes[]>([]);
	const [user, setUser] = useState({
		username: '',
		email: '',
		password: '',
		password2: '',
	});
	const [birth, setBirth] = useState<Date | null>(null);
	const router = useRouter();

	const handleSubmit = async (event: BaseSyntheticEvent) => {
		event.preventDefault();

		// Check if a username was entered
		if (user.username.length == 0) {
			return setErrors([{ type: 'username', message: 'This field is missing.' }]);
		} else if (user.username.includes('bad')) {
			// Sanitise usernames (Show error of what characters are invalid)
			return setErrors([{ type: 'username', message: 'Contains prohibited words/letters.' }]);
		}

		// Check if an email was entered
		if (user.email.length == 0) return setErrors([{ type: 'email', message: 'This field is missing.' }]);

		// Make sure passwords match
		if (user.password.length == 0 || user.password2.length == 0) {
			return setErrors([{ type: 'password', message: 'This field is missing.' }]);
		} else if (user.password != user.password2) {
			return setErrors([{ type: 'password', message: 'The passwords do not match.' }]);
		} else if (user.password.length <= 8) {
			return setErrors([{ type: 'password', message: 'Your password must be more than 8 characters.' }]);
		}

		// Make sure DOB was entered
		if (birth == null) return setErrors([{ type: 'age', message: 'This field is missing.' }]);

		// Make sure the user isn't younger than 16 years old.
		if (birth >= new Date(new Date().setFullYear(new Date().getFullYear() - 16))) {
			return setErrors([{ type: 'age', message: 'You must be 16 years and older to use this site.' }]);
		}

		// Create the new user
		const { data, error } = await authClient.signUp.email({
			email: user.email,
			password: user.password,
			name: user.username,
			callbackURL: '/login',
		});

		if (error) return setErrors([{ type: 'misc', message: `${error.message}` }]);
		if (data) router.push('/login');
	};

	const changeState = () => setDisabled(!disabled);

	return (
		<>
			<Head>
				<title>{process.env.NEXT_PUBLIC_COMPANY_NAME} - Register</title>
			</Head>
			<section className='d-flex flex-row align-items-center' style={{ 'backgroundColor': '#eee', padding: '0', minHeight: '100vh' }}>
				<div className="container">
					{errors.find(i => i.type == 'misc') &&
      	 <ErrorPopup text={errors.find(i => i.type == 'misc')?.message as string}/>
					}
					<div className="row d-flex justify-content-center align-items-center">
						<div className="col-lg-12 col-xl-11">
							<Card>
								<Card.Body>
									<div className="row">
										<div className="col-lg-6 order-2 order-lg-1">
											<p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Sign up</p>
											<form className="mx-1 mx-md-4" onSubmit={handleSubmit}>
												<InputField title="Username" name="username" onChange={(e) => setUser(u => ({ ...u, username: e.target.value }))} errorMsg={errors.find(e => e.type == 'username')?.message} />

												<InputField title="Email" name="email" type='email' onChange={(e) => setUser(u => ({ ...u, email: e.target.value }))} errorMsg={errors.find(e => e.type == 'email')?.message} />

												<div className="d-flex flex-row align-items-center">
													<div className="row">
														<div className="col-sm-6">
															<InputField title="Password" name="password" type='password' autocomplete='new-password' onChange={(e) => setUser(u => ({ ...u, password: e.target.value }))} errorMsg={errors.find(e => e.type == 'password')?.message} />
														</div>
														<div className="col-sm-6">
															<InputField title="Repeat password" name="password2" type='password' autocomplete='new-password' onChange={(e) => setUser(u => ({ ...u, password2: e.target.value }))} errorMsg={errors.find(e => e.type == 'password')?.message} />
														</div>
													</div>
												</div>
												<div className="form-outline row flex-fill">
													<InputField type="date" title="Date of birth" name="dob" autocomplete="bday" onChange={(e) => setBirth(e.target.valueAsDate)} errorMsg={errors.find(e => e.type == 'age')?.message} />
												</div>
											&nbsp;
												<div className="form-check d-flex justify-content-center mb-5">
													<input className="form-check-input me-2" type="checkbox" value="" id="T&S" onClick={changeState}/>
													<label className="form-check-label" htmlFor="T&S">
                  				I agree to the <Link href="/terms-of-service">Terms of service</Link>.
													</label>
												</div>

												<div className="d-flex justify-content-center mx-4 mb-3 mb-lg-4">
													<button type="submit" className="btn btn-primary btn-lg" disabled={disabled}>Register</button>
												</div>
											</form>
											<p>Already have an account? <Link href="/login">Click here</Link></p>
										</div>
										<div className="col-lg-6 d-flex align-items-center order-1 order-lg-2">
											<Image src="/register.webp" className="img-fluid" alt="Sample image" width={530} height={280}/>
										</div>
									</div>
								</Card.Body>
							</Card>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await auth.api.getSession({
		headers: new Headers({
			cookie: context.req.headers.cookie || '',
		}),
	});

	// Only show this page if they are not logged in
	if (session) {
		return {
			redirect: {
				destination: '/files',
				permanent: false,
			},
		};
	} else {
		return { props: {} };
	}
}