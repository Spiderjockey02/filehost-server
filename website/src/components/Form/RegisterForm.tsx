import type { RegisterFormError, RegisterFormErrorTypes } from '@/types/errors';
import { useToast } from '../Hooks/ToastManager';
import { useState, FormEvent } from 'react';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import InputField from './InputField';
import Link from 'next/link';

export default function RegisterForm() {
	const [errors, setErrors] = useState<RegisterFormError[]>([]);
	const [birth, setBirth] = useState<Date | null>(null);
	const [disabled, setDisabled] = useState(true);
	const router = useRouter();
	const { showToast } = useToast();
	const [user, setUser] = useState({
		username: '',
		email: '',
		password: '',
		password2: '',
	});

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		// First check empty fields
		const tempErrors: Map<RegisterFormErrorTypes, string> = new Map();
		if (user.username.length == 0) tempErrors.set('username', 'This field is missing.');
		if (user.password.length == 0 || user.password2.length == 0) tempErrors.set('password', 'This field is missing.');
		if (user.password != user.password2) tempErrors.set('password', 'The passwords do not match.');
		if (user.password.length <= 8) tempErrors.set('password', 'Your password must be more than 8 characters.');
		if (user.email.length == 0) tempErrors.set('email', 'This field is missing.');
		if (birth == null) tempErrors.set('age', 'This field is missing.');
		if (birth && birth >= new Date(new Date().setFullYear(new Date().getFullYear() - 16))) tempErrors.set('age', 'You must be 16 years and older to use this site.');

		// Check if any errors were present
		if (tempErrors.size > 0) return setErrors([...tempErrors.entries().map(e => ({ type: e[0], message: e[1] }))]);

		// Create the new user
		const { data, error } = await authClient.signUp.email({
			email: user.email,
			password: user.password,
			name: user.username,
			callbackURL: '/login',
		});

		if (error) return showToast('error', `${error.message}`);
		if (data) router.push('/login');
	};

	const changeState = () => setDisabled(!disabled);

	return (
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
	);
}