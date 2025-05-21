import { ErrorPopup, SuccessPopup, InputField, Card } from '@/components';
import type { BaseSyntheticEvent } from 'react';
import { SettingErrorTypes } from '@/types';
import MainLayout from '@/layouts/main';
import { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { authClient } from '@/auth/client';
import { auth } from '@/auth/server';
import { GetServerSidePropsContext } from 'next';

export default function Settings() {
	const { data: session } = authClient.useSession();
	const [errors, setErrors] = useState<SettingErrorTypes[]>([]);
	const [email, setEmail] = useState('');
	const [success, setSuccess] = useState('');
	const [passwords, setPasswords] = useState({
		currentPassword: '',
		newPassword: '',
		repeatNewPassword: '',
	});

	const onFileUploadChange = async (e: BaseSyntheticEvent) => {
		const fileInput = e.target;
		if (!fileInput.files) return alert('No file was chosen');
		if (!fileInput.files || fileInput.files.length === 0) return alert('Files list is empty');

		try {
			const formData = new FormData();
			formData.append('media', fileInput.files[0] as File);

			const { data } = await axios.post('/api/session/change-avatar', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			if (data.success) setSuccess(data.success);
		} catch (err) {
			console.log(err);
			setErrors([{ type: 'av', text: 'Failed to upload avatar' }]);
		}
	};

	const deleteAvatar = async () => {
		try {
			const { data } = await axios.delete('/api/session/reset-avatar');
			if (data.success) setSuccess(data.success);
		} catch (err) {
			console.log(err);
			setErrors([{ type: 'av', text: 'Failed to delete avatar' }]);
		}
	};

	const onPasswordSubmit = async (e: BaseSyntheticEvent) => {
		e.preventDefault();
		const { currentPassword, newPassword, repeatNewPassword } = passwords;
		if (currentPassword.length == 0) return setErrors([{ type: 'current', text: 'This field is missing' }]);

		// Make sure both fields are not empty
		if (newPassword.length == 0 || repeatNewPassword.length == 0) {
			const errs = new Array<SettingErrorTypes>();
			if (newPassword.length == 0) errs.push({ type: 'pwd1', text: 'This field is missing' });
			if (repeatNewPassword.length == 0) errs.push({ type: 'pwd2', text: 'This field is missing' });
			return setErrors(errs);
		}

		if (newPassword.length <= 8) return setErrors([{ type: 'pwd1', text: 'Your password must be more than 8 characters' }]);

		// Make sure the new password fields match
		if (newPassword !== repeatNewPassword) return setErrors([{ type: 'pwd1', text: 'The passwords do not match' }]);

		try {
			await authClient.changePassword({
				newPassword, currentPassword,
				revokeOtherSessions: true,
			});
		} catch {
			setErrors([{ type: 'pwd1', text: 'asd' }]);
		}
	};

	const onPersonalSubmit = async (e: BaseSyntheticEvent) => {
		e.preventDefault();

		if (email.length == 0) return setErrors([{ type: 'email', text: 'This field is missing.' }]);
		try {
			await authClient.changeEmail({
				newEmail: email,
			});
		} catch (error) {
			if (axios.isAxiosError(error)) {
				setErrors([{ type: 'email', text: error.response?.data.error }]);
			} else {
				setErrors([{ type: 'av', text: 'Failed to edit personal information.' }]);
			}
		}
	};

	const ahjksd = async () => {
		const sessions = await authClient.listSessions();
		console.log(sessions);
	};

	if (session == null) return null;
	return (
		<MainLayout user={session.user} tabName='Settings'>
			<section className="d-flex flex-row align-items-center" style={{ 'backgroundColor': '#eee', padding: '5% 0' }}>
				<Card className='container'>
					<Card.Body>
						<div className="row" style={{ margin: '5px' }}>
							<div className='col-lg-1 nav nav-pills flex-column' id="v-pills-tab" role="tablist" aria-orientation="vertical" style={{ padding: 0 }}>
								<button className="nav-link active" id="v-pills-home-tab" data-bs-toggle="pill" data-bs-target="#v-pills-home" type="button" role="tab" aria-controls="v-pills-home" aria-selected="true">Account</button>
								<button className="nav-link" id="v-pills-profile-tab" data-bs-toggle="pill" data-bs-target="#v-pills-profile" type="button" role="tab" aria-controls="v-pills-profile" aria-selected="false">Billing</button>
							</div>
							<div className='col-lg-11 tab-content' id="v-pills-tabContent">
								{errors.find(c => c.type == 'av') !== undefined && <ErrorPopup text={`${errors.find(c => c.type == 'av')?.text}`} />}
								{success.length != 0 && <SuccessPopup text={success} />}
								<div className="tab-pane fade show active" id="v-pills-home" role="tabpanel" aria-labelledby="v-pills-home-tab" >
									<h3 className="mb-4">Account Settings</h3>
									<div className="d-flex flex-column align-items-center">
										<Image src={session.user?.image ?? '/avatar'} width={100} height={100} className="rounded-circle " alt="User avatar" />
										&nbsp;
										<div className="d-flex justify-content-center gap-2">
											<label className="btn btn-sm btn-primary">
												File upload<input type="file" hidden name="sampleFile" className="upload-input" onChange={onFileUploadChange} accept="image/*" />
											</label>
											<button className="btn btn-sm btn-danger" onClick={() => deleteAvatar()}>Remove</button>
										</div>
									</div>
									<ul className="nav nav-tabs mt-4" id="account-tabs">
										<li className="nav-item">
											<a className="nav-link active" href="#personal-info" data-bs-toggle="tab">Personal Information</a>
										</li>
										<li className="nav-item">
											<a className="nav-link" href="#password" data-bs-toggle="tab">Password</a>
										</li>
									</ul>
									<div className="tab-content mt-3">
										<div className="tab-pane fade show active" id="personal-info">
											<form className='mt-4' onSubmit={onPersonalSubmit}>
												<InputField title='Update Name' name='name' placeholder={session.user?.name} />
												<InputField title='Update Email' name="email" placeholder={session.user?.email} errorMsg={errors.find(e => e.type == 'email')?.text} onChange={(e) => setEmail(e.target.value)} />
												<button type="submit" className="btn btn-primary float-end">Save Changes</button>
											</form>
										</div>
										<div className="tab-pane fade" id="password">
											<form className="mt-4" onSubmit={onPasswordSubmit}>
												<InputField title="Current Password" name="current-password" autocomplete='current-password' type='password' errorMsg={errors.find(e => e.type == 'current')?.text} onChange={(e) => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
												<div className="row">
													<div className="col-md-6">
														<InputField title="New Password" name="new-password" autocomplete='new-password' type='password' errorMsg={errors.find(e => e.type == 'pwd1')?.text} onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
													</div>
													<div className="col-md-6">
														<InputField title="Repeat Password" name="repeat-password" autocomplete='new-password' type='password' errorMsg={errors.find(e => e.type == 'pwd2')?.text} onChange={(e) => setPasswords(p => ({ ...p, repeatNewPassword: e.target.value }))} />
													</div>
												</div>
												<button type="submit" className="btn btn-primary float-end">Save Changes</button>
											</form>
										</div>
									</div>
								</div>
								<div className="tab-pane fade" id="v-pills-profile" role="tabpanel" aria-labelledby="v-pills-profile-tab">
									<h3 className="mb-4">Billing Information</h3>
									<p>Billing settings will be available here.</p>
									<button onClick={ahjksd}>asd</button>
								</div>
							</div>
						</div>
					</Card.Body>
				</Card>
			</section>
		</MainLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await auth.api.getSession({
		headers: new Headers({
			cookie: context.req.headers.cookie || '',
		}),
	});

	// Only show this page if they are logged in
	if (session == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		return { props: {} };
	}
}