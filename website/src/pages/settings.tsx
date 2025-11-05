import { ErrorPopup, SuccessPopup, InputField, Card, Table } from '@/components';
import type { BaseSyntheticEvent } from 'react';
import { AccountProviders, SettingErrorTypes } from '@/types';
import MainLayout from '@/layouts/main';
import { useState } from 'react';
import { authClient } from '@/auth/client';
import { GetServerSidePropsContext } from 'next';
import User2FAModal from '@/components/Modals/User2FAModal';
import { useQuery } from '@tanstack/react-query';
import { parseUserAgent, queryOptions } from '@/utils/functions';
import { AvatarUploadForm } from '@/components/Form/AvatarUploadForm';
import { Session } from '@prisma/client';

export default function Settings() {
	const { data: session, refetch } = authClient.useSession();
	const [errors, setErrors] = useState<SettingErrorTypes[]>([]);
	const [newUser, setNewUser] = useState({
		email: '',
		name: '',
	});
	const [success, setSuccess] = useState('');
	const [passwords, setPasswords] = useState({
		currentPassword: '',
		newPassword: '',
		repeatNewPassword: '',
	});

	const { data: accountData } = useQuery({
		queryKey: ['userAccounts'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/session/accounts', { signal });
			if (!res.ok) throw new Error(`Failed to fetch user information: ${res.statusText}`);

			const d = await res.json();
			return d as { accounts: AccountProviders[] };
		},
		...queryOptions,
	});

	const { data: sessionData } = useQuery({
		queryKey: ['userSessions'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/session/list', { signal });
			if (!res.ok) throw new Error(`Failed to fetch user information: ${res.statusText}`);

			const d = await res.json();
			return d as { sessions: Session[] };
		},
		...queryOptions,
	});

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
			setErrors([{ type: 'pwd1', text: 'Failed to update password.' }]);
		}
	};

	const onPersonalSubmit = async (e: BaseSyntheticEvent) => {
		e.preventDefault();
		const { name } = newUser;
		if (name.length == 0) return setErrors([{ type: 'name', text: 'This field is missing.' }]);

		try {
			const res = await fetch('/api/session/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
			const data = await res.json();
			console.log(data);
			refetch();
		} catch {
			setErrors([{ type: 'av', text: 'Failed to edit personal information.' }]);
		}
	};

	if (session == null) return null;
	return (
		<MainLayout user={session.user} tabName="Settings">
			<section className="d-flex flex-row align-items-center" style={{ backgroundColor: '#eee', padding: '5% 0' }}>
				{errors.find((c) => c.type == 'av') && (
					<ErrorPopup text={errors.find((c) => c.type == 'av')?.text as string} />
				)}
				{success.length !== 0 && <SuccessPopup text={success} />}
				<Card className="container">
					<Card.Body>
						<div className="row" style={{ margin: '5px' }}>
							<div className="col-lg-2 nav nav-pills flex-column" id="v-pills-tab" role="tablist" aria-orientation="vertical" style={{ padding: 0 }}>
								<button className="nav-link active" id="v-pills-account-tab" data-bs-toggle="pill" data-bs-target="#v-pills-account" type="button" role="tab" aria-controls="v-pills-account" aria-selected="true">
             			Account
								</button>
								<button className="nav-link" id="v-pills-billing-tab" data-bs-toggle="pill" data-bs-target="#v-pills-billing" type="button" role="tab" aria-controls="v-pills-billing" aria-selected="false">
              		Billing
								</button>
								<button className="nav-link" id="v-pills-sessions-tab" data-bs-toggle="pill" data-bs-target="#v-pills-sessions" type="button" role="tab" aria-controls="v-pills-sessions" aria-selected="false">
              		Sessions
								</button>
							</div>
							<div className="col-lg-10 tab-content" id="v-pills-tabContent">
								<div className="tab-pane fade show active" id="v-pills-account" role="tabpanel" aria-labelledby="v-pills-account-tab">
									<h3 className="mb-4">Account Settings</h3>
									<AvatarUploadForm user={session.user} setSuccess={setSuccess} setErrors={setErrors} />
									<ul className="nav nav-tabs mt-4" id="account-tabs">
										<li className="nav-item">
											<a className="nav-link active" href="#personal-info" data-bs-toggle="tab">
                    		Personal Info
											</a>
										</li>
										<li className="nav-item">
											<a className="nav-link" href="#connections" data-bs-toggle="tab">
                    		Connections
											</a>
										</li>
										{accountData?.accounts.find(a => a.provider === 'credential') !== undefined && (
											<li className="nav-item">
												<a className="nav-link" href="#password" data-bs-toggle="tab">
                      	Password
												</a>
											</li>
										)}
									</ul>
									<div className="tab-content mt-3">
										<div className="tab-pane fade show active" id="personal-info">
											<form className="mt-4" onSubmit={onPersonalSubmit}>
												<InputField title="Update Name" name="name" placeholder={session.user?.name} errorMsg={errors.find((e) => e.type == 'name')?.text} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} />
												{accountData?.accounts.find(a => a.provider === 'credential') !== undefined && (
													<InputField title="Update Email" name="email" placeholder={session.user?.email} errorMsg={errors.find((e) => e.type == 'email')?.text} onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))} />
												)}
												<button type="submit" className="btn btn-primary float-end">
                      		Save Changes
												</button>
											</form>
										</div>
										<div className="tab-pane fade" id="connections">
											<h5>Connected Accounts</h5>
											<p className="text-muted">
                    		Manage your connected OAuth providers.
											</p>
											<div className="list-group">
												{['google', 'discord'].map((provider) => (
													<div key={provider} className="list-group-item d-flex justify-content-between align-items-center">
														<span className="text-capitalize">{provider}</span>
														{accountData?.accounts.map(a => a.provider).includes(provider) ? (
															<button className="btn btn-sm btn-outline-danger">
                            		Disconnect
															</button>
														) : (
															<button className="btn btn-sm btn-outline-primary" onClick={() => authClient.linkSocial({ provider })}>
                            		Connect
															</button>
														)}
													</div>
												))}
											</div>
										</div>

										{/* Password (only if user uses credentials) */}
										{accountData?.accounts.find(a => a.provider === 'credential') !== undefined && (
											<div className="tab-pane fade" id="password">

												<form className="mt-4" onSubmit={onPasswordSubmit}>
													<InputField title="Current Password" name="current-password" autocomplete="current-password" type="password" errorMsg={errors.find((e) => e.type == 'current')?.text} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
													/>
													<div className="row">
														<div className="col-md-6">
															<InputField title="New Password" name="new-password" autocomplete="new-password" type="password" errorMsg={errors.find((e) => e.type == 'pwd1')?.text}
																onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
															/>
														</div>
														<div className="col-md-6">
															<InputField title="Repeat Password" name="repeat-password" autocomplete="new-password" type="password" errorMsg={errors.find((e) => e.type == 'pwd2')?.text} onChange={(e) => setPasswords((p) => ({ ...p, repeatNewPassword: e.target.value }))} />
														</div>
													</div>
													<button className="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#User2FAModal">
                        		Enable 2FA
													</button>
													<User2FAModal />
													<button type="submit" className="btn btn-primary float-end">
                        		Save Changes
													</button>
												</form>
											</div>
										)}
									</div>
								</div>

								{/* Billing Tab */}
								<div className="tab-pane fade" id="v-pills-billing" role="tabpanel" aria-labelledby="v-pills-billing-tab">
									<h3 className="mb-4">Billing</h3>
									<p className="text-muted">
                		Manage your subscription plan and payment details.
									</p>
									<div className="d-flex flex-column gap-3">
										<div className="card p-3">
											<h5>Current Plan</h5>
											<p>{session.user?.plan.name} — Active</p>
										</div>
										<button className="btn btn-primary" onClick={() => null}>
                  		Manage Subscription
										</button>
									</div>
								</div>
								{/* Sessions Tab */}
								<div className="tab-pane fade" id="v-pills-sessions" role="tabpanel" aria-labelledby="v-pills-sessions-tab">
									<div className='table-responsive' style={{ overflowY: 'scroll', maxHeight: '75vh' }}>
										<Table>
											<Table.HeaderRow>
												<Table.Header>IP</Table.Header>
												<Table.Header>User Agent</Table.Header>
												<Table.Header>Created At</Table.Header>
												<Table.Header>Expires At</Table.Header>
												<Table.Header>Actions</Table.Header>
											</Table.HeaderRow>
											<Table.Body>
												{sessionData == undefined ? (
													[0, 0, 0, 0].map((_, index) => (
														<tr key={index}>
															{Array(5)
																.fill(0)
																.map((_1, idx) => (
																	<td key={idx} className="placeholder-glow">
																		<span className="placeholder col-12"></span>
																	</td>
																))}
														</tr>
													))
												) : (
													sessionData.sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
														.map((userSes) => {
															const isCurrent = userSes.id === session.session?.id;

															return (
																<tr key={userSes.id} className={isCurrent ? 'table-success' : ''}>
																	<td>
																		{userSes.ipAddress}
																		{isCurrent && (
																			<span className="badge bg-primary ms-2">Current</span>
																		)}
																	</td>
																	<td>{parseUserAgent(userSes.userAgent)}</td>
																	<td>{new Date(userSes.createdAt).toLocaleString()}</td>
																	<td>{new Date(userSes.expiresAt).toLocaleString()}</td>
																	<td>
																		{!isCurrent && (
																			<button className="btn btn-sm btn-outline-danger" onClick={() => authClient.revokeSession({
																				token: userSes.token,
																			})}
																			>
                    										Remove
																			</button>
																		)}
																	</td>
																</tr>
															);
														})
												)}
											</Table.Body>
										</Table>
									</div>
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
	const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
		headers: {
			cookie: context.req.headers.cookie || '',
		},
	});

	const data = await res.json();
	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		// Get the path from the URL
		const path = [context.params?.files].flat();
		return { props: { path: path.join('/') } };
	}
}