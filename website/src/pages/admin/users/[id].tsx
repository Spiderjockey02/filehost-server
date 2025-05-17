import { authClient } from '@/auth/client';
import { Col, Row, Table } from '@/components';
import AdminLayout from '@/layouts/admin';
import { AdminUser } from '@/types';
import { formatBytes, getStatusColor, parseUserAgent } from '@/utils/functions';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { GetServerSidePropsContext } from 'next';
import Image from 'next/image';

interface Props {
	user: AdminUser
}

export default function AdminUserIdPage({ user }: Props) {
	const { data: session } = authClient.useSession();
	if (session == null) return null;

	return (
		<AdminLayout activeTab="users" user={session.user} tabName={`Admin user: ${user.name}`}>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">User: {user.name}</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col lg={4}>
					<div className="card shadow-sm mb-4">
						<div className="card-body">
							<div className="d-flex align-items-center mb-3">
								<Image
									src={`/avatar/${user.id}`}
									alt="User Avatar"
									className="rounded-circle me-3"
									width={60}
									height={60}
									style={{ objectFit: 'cover', border: '1px solid #ddd' }}
								/>
								<div className="flex-grow-1">
									<h5 className="card-title mb-1">{user.name}</h5>
									<p className="card-subtitle text-muted">{user.email}</p>
								</div>
								<span className={`badge text-uppercase ${
									user.role === 'admin' ? 'bg-danger' : 'bg-secondary'
								}`}>
									{user.role}
								</span>
							</div>

							<ul className="list-unstyled mt-3 mb-2 small">
								<li><strong>Language:</strong> {user.languageCode}</li>
								<li><strong>Plan:</strong> {user.group.name}</li>
								<li>
									<strong>Email Verified:</strong>{' '}
									<span className={user.emailVerified ? 'text-success' : 'text-danger'}>
										{user.emailVerified ? 'Yes' : 'No'}
									</span>
								</li>
								<li>
									<strong>Account Status:</strong>{' '}
									{user.banned ? (
										<span className="text-danger">Banned</span>
									) : (
										<span className="text-success">Active</span>
									)}
								</li>
							</ul>

							<div className="mb-2">
								<label className="form-label mb-1 small"><strong>Storage Used:</strong></label>
								<div className="progress" style={{ height: '8px' }}>
									<div
										className={`progress-bar ${getStatusColor(user.totalStorageSize, user.group.maxStorageSize)}`}
										role="progressbar"
										style={{ width: `${(user.totalStorageSize / user.group.maxStorageSize) * 100}%` }}
										aria-valuenow={user.totalStorageSize}
										aria-valuemin={0}
										aria-valuemax={user.group.maxStorageSize}
									></div>
								</div>
								<div className="text-muted small mt-1">
									{formatBytes(user.totalStorageSize)} GB / {formatBytes(user.group.maxStorageSize)} GB
								</div>
							</div>

							<div className="text-muted small">
								<p className="mb-0">Created: {new Intl.DateTimeFormat('en-GB', {
									dateStyle: 'full',
									timeStyle: 'long',
								}).format(new Date(user.createdAt))}</p>
								<p>Updated: {new Intl.DateTimeFormat('en-GB', {
									dateStyle: 'full',
									timeStyle: 'long',
								}).format(new Date(user.updatedAt))}</p>
							</div>
							<div>
								Add stuff to edit the user (Ban, update group, send notification etc)
							</div>
						</div>
					</div>
				</Col>
				<Col lg={8}>
					<div className="card shadow mb-4">
						<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							<h4 className="m-0 font-weight-bold text-primary">Sessions</h4>
						</div>
						<div className="card-body table-responsive" style={{ overflowY: 'scroll', maxHeight: '75vh' }}>
							<Table>
								<Table.HeaderRow>
									<Table.Header>IP</Table.Header>
									<Table.Header>User Agent</Table.Header>
									<Table.Header>Created at</Table.Header>
									<Table.Header>Expires at</Table.Header>
								</Table.HeaderRow>
								<Table.Body>
									{user.sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(userSes => (
										<>
											<tr>
												<td>{userSes.ipAddress}</td>
												<td>{parseUserAgent(userSes.userAgent)}</td>
												<td>{new Date(userSes.createdAt).toLocaleDateString()}</td>
												<td>{new Date(userSes.expiresAt).toLocaleDateString()}</td>
											</tr>
										</>
									))}
								</Table.Body>
							</Table>
						</div>
					</div>
				</Col>
			</Row>
		</AdminLayout>
	);
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Validate path
	try {
		const userId = context.params?.id;
		const { data } = await axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/${userId}`, {
			headers: { cookie: context.req.headers.cookie },
		});
		console.log(data);
		return { props: { ...data } };
	} catch (err) {
		console.error(err);
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	}
}
