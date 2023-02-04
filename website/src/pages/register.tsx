import 'bootstrap/dist/css/bootstrap.css';
import { useState } from 'react';
import { useRouter } from 'next/router';
import type { BaseSyntheticEvent } from 'react';
const REGEX = /^[-a-z0-9~!$%^&*_=+}{'?]+(\.[-a-z0-9~!$%^&*_=+}{'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
import config from '../config';
import Link from 'next/link';
import Image from 'next/image';
type ErrorTypes = {
 type: 'username' | 'email' | 'password' | 'age'
 error: string
}

export default function Register() {
	const [disabled, setDisabled] = useState(true);
	const [errors, setErrors] = useState<ErrorTypes[]>([]);
	const router = useRouter();

	const handleSubmit = async (event: BaseSyntheticEvent) => {
		event.preventDefault();

		const username = (document.getElementById('username') as HTMLInputElement).value;
		const email = (document.getElementById('email') as HTMLInputElement).value;
		const password = (document.getElementById('password') as HTMLInputElement).value;
		const password2 = (document.getElementById('password2') as HTMLInputElement).value;
		const day = (document.getElementById('day') as HTMLSelectElement).value;
		const month = (document.getElementById('month') as HTMLSelectElement).value;
		const year = Number((document.getElementById('year') as HTMLSelectElement).value);

		// Check if a username was entered
		if (username.length == 0) {
			return setErrors([{ type: 'username', error: 'This field is missing' }]);
		} else if (username.includes('bad')) {
			// Sanitise usernames (Show error of what characters are invalid)
			return setErrors([{ type: 'username', error: 'Contains prohibited words/letters.' }]);
		}

		// Check if an email was entered
		if (email.length == 0) {
			return setErrors([{ type: 'email', error: 'This field is missing' }]);
		} else if (REGEX.test(email)) {
			// Check if the email was valid
			// Check if email has not been used before
			/*
			const res = await fetch(`${process.env.NEXT_PUBLIC_APIURL}/api/auth/check`, {
				method: 'post',
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
				body: JSON.stringify({
					email,
				}),
			});
			const data = await res.json();
			if (data.found) return setErrors([{ type: 'email', error: 'This email is already in use.' }]);
      */
		} else {
			return setErrors([{ type: 'email', error: 'Invalid email address' }]);
		}


		// Make sure passwords match
		if (password.length == 0 || password2.length == 0) {
			return setErrors([{ type: 'password', error: 'This field is missing' }]);
		} else if (password != password2) {
			return setErrors([{ type: 'password', error: 'The passwords do not match' }]);
		} else if (password.length <= 8) {
			return setErrors([{ type: 'password', error: 'Your password must be more than 8 characters' }]);
		}


		// Make sure it's a valid date of birth (for example not 30 days in February)
		if (!isNaN(Date.parse(`${month}-${day}-${year}`))) {
			return setErrors([{ type: 'age', error: 'Invalid date of birth' }]);
		} else if (year >= (new Date().getFullYear() - 13)) {
			// Make sure the user isn't younger than 13 years old.
			return setErrors([{ type: 'age', error: 'You are too young to use this website.' }]);
		}

		// Create the new user
		console.log(`${config.url}/api/auth/register`);
		const data = await fetch(`${config.url}/api/auth/register`, {
			method: 'post',
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
			body: JSON.stringify({
				username, email, password, password2: password,
			}),
		});
		const res = await data.json();
		if (res.success) router.push('/login');
	};

	function changeState() {
		return setDisabled(!disabled);
	}

	return (
		<section className="vh-100" style={{ 'backgroundColor': '#eee' }}>
			<div className="container h-100">
				<div className="row d-flex justify-content-center align-items-center h-100">
					<div className="col-lg-12 col-xl-11">
						<div className="card text-black" style={{ 'borderRadius': '25px' }}>
							<div className="card-body p-md-5">
								<div className="row justify-content-center">
									<div className="col-md-10 col-lg-6 col-xl-5 order-2 order-lg-1">
										<p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Sign up</p>
										<form className="mx-1 mx-md-4" onSubmit={handleSubmit}>
											<div className="d-flex flex-row align-items-center mb-4">
												<i className="fas fa-envelope fa-lg me-3 fa-fw"></i>
												<div className="form-outline flex-fill mb-0">
													{errors.find(i => i.type == 'username') ?
														<label className="form-label text-danger" htmlFor="username">Username - {errors.find(i => i.type == 'username')?.error}</label>
														: <label className="form-label" htmlFor="username">Username</label>
													}
													<input type="text" id="username" className="form-control" name="username" />
												</div>
											</div>

											<div className="d-flex flex-row align-items-center mb-4">
												<i className="fas fa-user fa-lg me-3 fa-fw"></i>
												<div className="form-outline flex-fill mb-0">
													{errors.find(i => i.type == 'email') ?
														<label className="form-label text-danger" htmlFor="email">Email - {errors.find(i => i.type == 'email')?.error}</label>
														: <label className="form-label" htmlFor="email">Email</label>
													}
													<input type="email" id="email" className="form-control" name="email" />
												</div>
											</div>

											<div className="d-flex flex-row align-items-center mb-4">
												<i className="fas fa-lock fa-lg me-3 fa-fw"></i>
												<div className="row">
													<div className="col-sm-6">
														<div className="form-outline flex-fill mb-0">
															{errors.find(i => i.type == 'password') ?
																<label className="form-label text-danger" htmlFor="password">Password - {errors.find(i => i.type == 'password')?.error}</label>
																: <label className="form-label" htmlFor="password">Password</label>
															}
															<input type="password" id="password" className="form-control" />
														</div>
													</div>
													<div className="col-sm-6">
														<div className="form-outline flex-fill mb-0">
															<label className="form-label" htmlFor="password">Repeat Password</label>
															<input type="password" id="password2" className="form-control" />
														</div>
													</div>
												</div>
											</div>

											<div className="d-flex flex-row align-items-center mb-4">
												<div className="form-outline row flex-fill mb-0" style={{ 'paddingLeft': '15px' }}>
													{errors.find(i => i.type == 'age') ?
														<label className="form-label text-danger">Date of birth - {errors.find(i => i.type == 'age')?.error}</label>
														: <label className="form-label">Date of birth</label>
													}
													<div className="col-sm-4">
														<select className="form-select" aria-label="Default select example" id="day" name="day">
															<option defaultValue="true" disabled>Day</option>
															{[...Array(31)].map((_, index) => (
																<option key={index} value={String(index + 1)}>{index + 1}</option>
															))}
														</select>
													</div>
													<div className="col-sm-4">
														<select className="form-select" aria-label="Default select example" id="month" name="month">
															<option defaultValue="true" disabled>Month</option>
															{[ 'January', 'February', 'March', 'April', 'May', 'June',
																'July', 'August', 'September', 'October', 'November', 'December' ].map((i, index) => (
																<option key={index} value={String(index)}>{i}</option>
															))}
														</select>
													</div>
													<div className="col-sm-4">
														<select className="form-select" aria-label="Default select example" id="year" name="year">
															<option defaultValue="true" disabled>Year</option>
															{[...Array(100)].map((_, index) => (
																<option key={index} value={String(new Date().getFullYear() - index)}>{new Date().getFullYear() - index}</option>
															))}
														</select>
													</div>
												</div>
											</div>

											<div className="form-check d-flex justify-content-center mb-5">
												<input className="form-check-input me-2" type="checkbox" value="" id="T&S" onClick={changeState}/>
												<label className="form-check-label" htmlFor="T&S">
                  I agree to the <a href="/terms">Terms of service</a>.
												</label>
											</div>

											<div className="d-flex justify-content-center mx-4 mb-3 mb-lg-4">
												<button type="submit" className="btn btn-primary btn-lg" disabled={disabled}>Register</button>
											</div>
										</form>
										<p>Already have an account? <Link href="/login">Click here</Link></p>
									</div>
									<div className="col-md-10 col-lg-6 col-xl-7 d-flex align-items-center order-1 order-lg-2">
										<Image src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/draw1.webp"
											className="img-fluid" alt="Sample image" width={530} height={280}/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
