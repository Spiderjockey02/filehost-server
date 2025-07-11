import { authClient } from '@/auth/client';
import { Card, Col, Row, Table } from '@/components';
import AdminActivityCard from '@/components/Cards/AdminActivity';
import AdminRecentUploadsCards from '@/components/Cards/AdminRecentUploads';
import AdminUserIdCard from '@/components/Cards/AdminUserId';
import AdminLayout from '@/layouts/admin';
import { AdminUser } from '@/types';
import { parseUserAgent, queryOptions } from '@/utils/functions';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { User } from 'better-auth';
import { GetServerSidePropsContext } from 'next';

interface Props {
	userId: string
}

export default function AdminUserIdPage({ userId }: Props) {
	const { data: session } = authClient.useSession();

	const { data, isLoading } = useQuery({
		queryKey: ['adminUser', userId],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/users/${userId}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch user information: ${res.statusText}`);

			const d = await res.json();
			return d as { user: AdminUser };
		},
		...queryOptions,
	});

	if (session == null) return null;
	return (
		<AdminLayout activeTab="users" user={session.user as User} tabName={`Admin user: ${data?.user.name}`}>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">User: {data?.user.name}</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col lg={4}>
					<AdminUserIdCard isLoading={isLoading} user={data?.user ?? null} />
				</Col>
				<Col lg={8}>
					<Card className='mb-4'>
						<Card.Header>
							Active Sessions
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
									{isLoading || data == null ? (
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
										data?.user.sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(userSes => (
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
			<Row>
				<Col lg={4}>
					<AdminRecentUploadsCards userId={userId} />
				</Col>
				<Col lg={8}>
					<AdminActivityCard userId={userId} />
				</Col>
			</Row>
		</AdminLayout>
	);
};

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
	} else if (data.user.role !== 'admin') {
		return {
			redirect: {
				destination: '/files',
				permanent: false,
			},
		};
	} else {
		const userId = context.params?.id;
		return { props: { userId } };
	}
}