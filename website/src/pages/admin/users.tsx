import { Row, Col, InfoPill, Card, ObjectOrientedPieChart, LanguageDistributionPieChart, UserGrowthLineChart, UserRetentionLineChart } from '@/components';
import { faFolderTree, faHardDrive, faMemory, faUsers } from '@fortawesome/free-solid-svg-icons';
import { formatBytes, queryOptions } from '@/utils/functions';
import { useToast } from '@/components/Hooks/ToastManager';
import { AdminManageUsersCard } from '@/components/Cards';
import type { GetServerSidePropsContext } from 'next';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/auth/server';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminUsersPage() {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminUsers'],
		queryFn: async ({ signal }) => Promise.all([
			API.ADMIN.fetchUserEmailDomains(signal),
			API.ADMIN.fetchUserSignupSources(signal),
			API.ADMIN.fetchUserStats(signal),
		]),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab='users' user={session.user as Session['user']} tabName='Admin users'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">User Dashboard</h1>
			</div>
			<Row>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Total Users" text={data?.[2].total ?? 0} icon={faUsers} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="New users (7 days)" text={data?.[2].new ?? 0} icon={faFolderTree} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Active users (7 days)" text={data?.[2].active ?? 0} icon={faHardDrive} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Average Storage Used" text={formatBytes(data?.[2].avgstorageUsage)} icon={faHardDrive} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Banned users" text={data?.[2].banned ?? 0} icon={faMemory} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Admins" text={data?.[2].admins ?? 0} icon={faMemory} isLoading={isLoading} />
				</Col>
			</Row>
			<Row>
				<Col lg={6}>
					<UserGrowthLineChart />
				</Col>
				<Col lg={6}>
					<Card className='mb-4'>
						<Card.Header>
							User Retention Over Time
						</Card.Header>
						<Card.Body>
							<UserRetentionLineChart />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Row>
				<Col lg={4} className='mb-4'>
					<LanguageDistributionPieChart />
				</Col>
				<Col lg={4} className='mb-4'>
					<Card>
						<Card.Header>
							Sign up sources
						</Card.Header>
						<Card.Body className='d-flex justify-content-center'>
							<ObjectOrientedPieChart data={data?.[1].signupSource ?? {}} />
						</Card.Body>
					</Card>
				</Col>
				<Col lg={4} className='mb-4'>
					<Card>
						<Card.Header>
							Email domains Distribution
						</Card.Header>
						<Card.Body className='d-flex justify-content-center'>
							<ObjectOrientedPieChart data={data?.[0].emails ?? {}} />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<AdminManageUsersCard />
		</AdminLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
// Check is user is logged in
	const data = await API.SESSION.fetchCurrentSession(context.req.headers.cookie || '');
	if (!data.isLoggedin) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	}

	// Check if user is admin
	if (!data.isAdmin) {
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