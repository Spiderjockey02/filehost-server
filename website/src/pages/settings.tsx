import { useSession } from 'next-auth/react';
import NavBar from '../components/navbars/home-navbar';
import ErrorPopup from '../components/menus/Error-pop';
import SuccessPopup from '../components/menus/Success-pop';
import Footer from '../components/footer';
import type { BaseSyntheticEvent } from 'react';
import { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface ErrorTypes {
	type: 'current' | 'pwd1' | 'pwd2' | 'misc'
	error: string
}


export default function Settings() {
	const { data: session, status } = useSession({ required: true });
	const [errors, setErrors] = useState<ErrorTypes[]>([]);
	const [success, setSuccess] = useState('');
	if (status == 'loading') return null;

	const handlePasswordChange = async (event: BaseSyntheticEvent) => {
		event.preventDefault();

		// Get text fields
		const currentPassword = (document.getElementById('currentPwd') as HTMLInputElement).value;
		const password = (document.getElementById('password1') as HTMLInputElement).value;
		const password2 = (document.getElementById('password2') as HTMLInputElement).value;

		// Make sure currentpwd field is entered
		if (currentPassword.length == 0) return setErrors([{ type: 'current', error: 'This field is missing' }]);

		// Make sure both fields are not empty
		if (password.length == 0 || password2.length == 0) {
			const errs = new Array<ErrorTypes>();
			if (password.length == 0) errs.push({ type: 'pwd1', error: 'This field is missing' });
			if (password2.length == 0) errs.push({ type: 'pwd2', error: 'This field is missing' });
			return setErrors(errs);
		}

		if (password.length <= 8) return setErrors([{ type: 'pwd1', error: 'Your password must be more than 8 characters' }]);

		// Make sure the new password fields match
		if (password !== password2) return setErrors([{ type: 'pwd1', error: 'The passwords do not match' }]);

		// Send request to API
		try {
			const { data } = await axios.post<{
          success?: string
					error?: ErrorTypes
      }>(`/api/user/${session.user.id}/change-password`, {
      	password, password2, currentPassword,
      });
			if (data.success) setSuccess(data.success);
			if (data.error) setErrors([data]);
			console.log(errors);
		} catch (err) {
			console.log('error', err);
		}
	};
	return (
		<>
			<NavBar />
			<section className="vh-50" style={{ 'backgroundColor': '#eee' }}>
				<div className="container h-100">
					<div className="row d-flex justify-content-center align-items-center h-100">
						<div className="col-lg-10 col-xl-9">
							{errors.find(i => i.type == 'misc') && (
								<ErrorPopup text={errors.find(i => i.type == 'misc')?.error as string} />
							)}
							{success.length > 0 && (
								<SuccessPopup text={success}/>
							)}
							<div className="card text-black" style={{ 'borderRadius': '25px' }}>
								<div className="card-body p-md-5">
									<div className="row justify-content-center">
										<div className="order-2 order-lg-1">
											<div className="d-flex align-items-start">
												<div className="nav flex-column nav-pills me-3" id="v-pills-tab" role="tablist" aria-orientation="vertical">
													<button className="nav-link active" id="v-pills-home-tab" data-bs-toggle="pill" data-bs-target="#v-pills-home" type="button" role="tab" aria-controls="v-pills-home" aria-selected="true">Account</button>
													<button className="nav-link" id="v-pills-profile-tab" data-bs-toggle="pill" data-bs-target="#v-pills-profile" type="button" role="tab" aria-controls="v-pills-profile" aria-selected="false">Billing</button>
												</div>
												<div className="tab-content" id="v-pills-tabContent">
													<div className="tab-pane fade show active" id="v-pills-home" role="tabpanel" aria-labelledby="v-pills-home-tab">
														<h1>Account</h1>
														<div className="row">
															<div className="col-lg-6">
																<div className="media">
																	<Image src={`/avatar/${session?.user.id}`} width={100} height={100} className="rounded-circle" alt="User avatar" />
																	<div className="media-body">
																		<h5 className="mt-0" style={{ paddingBottom:'20px' }}>Avatar</h5>
																		<form action="/user/avatar/upload" method="post" encType="multipart/form-data" id='uploadForm' >
																			<label className="btn btn-md btn-secondary" id="fileHover">
																			Upload<input type="file" hidden name="sampleFile" onChange={() => document.getElementById('imagefile')?.click()} />
																			</label>
																			<button type="submit" style={{ display:'none;' }} id="imagefile"></button>
																		</form>
																		<form action="/user/avatar/delete" method="post" encType="multipart/form-data" id='uploadForm' >
																			<button className="btn btn-md btn-danger" type="submit" name="button">Remove</button>
																		</form>
																	</div>
																</div>
															</div>
															<div className="col-lg-6">
																<form onSubmit={handlePasswordChange}>
																	<div className="d-flex flex-row align-items-center mb-4">
																		<div className="form-outline flex-fill mb-0">
																			{errors.find(i => i.type == 'current') ?
																				<label className="form-label text-danger" htmlFor="currentPwd">Current Password - {errors.find(i => i.type == 'current')?.error}</label>
																				: <label className="form-label" htmlFor="currentPwd">Current Password</label>
																			}
																			<input type="password" id="currentPwd" className="form-control" name="currentPwd" />
																		</div>
																	</div>
																	<div className="row">
																		<div className="col-lg-6">
																			<div className="d-flex flex-row align-items-center mb-4">
																				<div className="form-outline flex-fill mb-0">
																					{errors.find(i => i.type == 'pwd1') ?
																						<label className="form-label text-danger" htmlFor="password1">New password - {errors.find(i => i.type == 'pwd1')?.error}</label>
																						: <label className="form-label" htmlFor="password1">New password</label>
																					}
																					<input type="password" id="password1" className="form-control" name="password1" />
																				</div>
																			</div>
																		</div>
																		<div className="col-lg-6">
																			<div className="d-flex flex-row align-items-center mb-4">
																				<div className="form-outline flex-fill mb-0">
																					{errors.find(i => i.type == 'pwd2') ?
																						<label className="form-label text-danger" htmlFor="password2">Repeat password - {errors.find(i => i.type == 'pwd2')?.error}</label>
																						: <label className="form-label" htmlFor="password2">Repeat password</label>
																					}
																					<input type="password" id="password2" className="form-control" name="password2" />
																				</div>
																			</div>
																		</div>
																	</div>
																	<button type="submit" className="btn btn-primary">Submit</button>
																</form>
															</div>
														</div>
													</div>
													<div className="tab-pane fade" id="v-pills-profile" role="tabpanel" aria-labelledby="v-pills-profile-tab">
														<div className="tab-pane fade show active" id="v-pills-home" role="tabpanel" aria-labelledby="v-pills-home-tab">
															<h1>Billing</h1>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			<Footer />
		</>
	);
}
