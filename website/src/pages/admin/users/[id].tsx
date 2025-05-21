import { authClient } from '@/auth/client';
import { auth } from '@/auth/server';
import { Card, Col, Row, Table } from '@/components';
import AdminUserIdCard from '@/components/Cards/AdminUserId';
import AdminLayout from '@/layouts/admin';
import { AdminUser } from '@/types';
import { parseUserAgent } from '@/utils/functions';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { User } from 'better-auth';
import { GetServerSidePropsContext } from 'next';
import { useEffect, useState } from 'react';

interface Props {
	userId: string
}

export default function AdminUserIdPage({ userId }: Props) {
	const { data: session } = authClient.useSession();
	const [user, setUser] = useState<AdminUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);


	useEffect(() => {
		setIsLoading(true);
		async function fetchData() {
			const res = await fetch(`/api/admin/users/${userId}`, { cache: 'no-cache' });
			const data = await res.json();
			setUser(data.user);
			setIsLoading(false);
		}
		fetchData();
	}, [userId]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab="users" user={session.user as User} tabName={`Admin user: ${user?.name}`}>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">User: {user?.name}</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col lg={4}>
					<AdminUserIdCard isLoading={isLoading} user={user} />
				</Col>
				<Col lg={8}>
					<Card>
						<Card.Header>
							Sessions
						</Card.Header>
						<Card.Body className='table-responsive' style={{ overflowY: 'scroll', maxHeight: '75vh' }}>
							<Table>
								<Table.HeaderRow>
									<Table.Header>IP</Table.Header>
									<Table.Header>User Agent</Table.Header>
									<Table.Header>Created at</Table.Header>
									<Table.Header>Expires at</Table.Header>
								</Table.HeaderRow>
								<Table.Body>
									{isLoading || user == null ? (
										[0, 0, 0, 0].map((_, index) => (
											<tr key={index}>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
											</tr>
										))
									) : (
										user.sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(userSes => (
											<tr key={userSes.id}>
												<td>{userSes.ipAddress}</td>
												<td>{parseUserAgent(userSes.userAgent)}</td>
												<td>{new Date(userSes.createdAt).toLocaleDateString()}</td>
												<td>{new Date(userSes.expiresAt).toLocaleDateString()}</td>
											</tr>
										))
									)}
								</Table.Body>
							</Table>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</AdminLayout>
	);
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await auth.api.getSession({
		headers: new Headers({
			cookie: context.req.headers.cookie || '',
		}),
	});

	// Only show this page if they are logged in
	if (session == null || session.user?.role !== 'ADMIN') {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		const userId = context.params?.id;
		return { props: { userId } };
	}
}