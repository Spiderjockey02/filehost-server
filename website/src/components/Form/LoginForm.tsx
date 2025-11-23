import type { LoginFormError } from '@/types/errors';
import { useToast } from '../Hooks/ToastManager';
import { User2FAInputModal } from '../Modals';
import { FormEvent, useState } from 'react';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import InputField from './InputField';

export default function LoginForm() {
	const [errors, setErrors] = useState<LoginFormError[]>([]);
	const [show2FAModal, setShow2FAModal] = useState(false);
	const { showToast } = useToast();
	const router = useRouter();
	const { callbackUrl } = router.query;
	const [user, setUser] = useState({
		email: '',
		password: '',
	});

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		const err = [] as LoginFormError[];

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
				if (context.data.twoFactorRedirect) setShow2FAModal(true);
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
						showToast('error', 'Failed to login.');
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

			if (error) return showToast('error', `${error.message}`);
			if (data !== null) return showToast('success', data.message);
		} catch (err) {
			console.log(err);
			showToast('error', 'Failed to request password reset');
		}
	}

	return (
		<form className="w-100" onSubmit={handleSubmit}>
			<User2FAInputModal setShow={setShow2FAModal} show={show2FAModal} />
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
	);
}