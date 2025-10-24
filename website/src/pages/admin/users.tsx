import type { AdminUserPageProps } from '@/types/pages';
import type { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import type { User } from 'better-auth';
import axios from 'axios';
import AdminLayout from '@/layouts/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFolderTree, faHardDrive, faMemory, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Row, Col, InfoPill, Card, ErrorPopup, ObjectOrientedPieChart, LanguageDistributionPieChart, UserGrowthLineChart, UserRetentionLineChart } from '@/components';
import { formatBytes, headers } from '@/utils/functions';
import AdminUserTableCards from '@/components/Cards/AdminUserTable';

export default function AdminUsersPage({ emails, signupSource, userStats, error }: AdminUserPageProps) {
	// Make sure user is logged in before accessing page
	const { data: session } = authClient.useSession();

	if (session == null) return null;
	return (
		<AdminLayout activeTab='users' user={session.user as User} tabName='Admin users'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">User Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			{error && <ErrorPopup text={error} />}
			<Row>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Total Users" text={userStats.total} icon={faUsers} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="New users (7 days)" text={userStats.new} icon={faFolderTree} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Active users (7 days)" text={userStats.active} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Average Storage Used" text={formatBytes(userStats.avgstorageUsage)} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Banned users" text={userStats.banned} icon={faMemory} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Admins" text={userStats.admins} icon={faMemory} />
				</Col>
			</Row>
			<Row className='mb-4'>
				<Col lg={6}>
					<UserGrowthLineChart />
				</Col>
				<Col lg={6}>
					<Card>
						<Card.Header>
							User Retention Over Time
						</Card.Header>
						<Card.Body>
							<UserRetentionLineChart />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Row className='mb-4'>
				<Col lg={4}>
					<LanguageDistributionPieChart />
				</Col>
				<Col lg={4}>
					<Card>
						<Card.Header>
							Sign up sources
						</Card.Header>
						<Card.Body className='d-flex justify-content-center'>
							<ObjectOrientedPieChart data={signupSource} />
						</Card.Body>
					</Card>
				</Col>
				<Col lg={4}>
					<Card>
						<Card.Header>
							Email domains Distribution
						</Card.Header>
						<Card.Body className='d-flex justify-content-center'>
							<ObjectOrientedPieChart data={emails} />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<AdminUserTableCards />
		</AdminLayout>
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
	} else if (data.user.role !== 'admin') {
		return {
			redirect: {
				destination: '/files',
				permanent: false,
			},
		};
	} else {
		// Validate path
		try {
			const [{ data: { emails } }, { data: { signupSource } }, { data: userStats }] = await Promise.all([
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/emails`, headers(context.req)),
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/signup-source`, headers(context.req)),
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/stats`, headers(context.req)),
			]);

			return { props: { emails, signupSource, userStats } };
		} catch (err) {
			console.log(err);
			return { props: {
				langaugeCodes: {}, emails: {}, signupSource: {}, userStats: {
					total: 0,
					avgstorageUsage: 0,
					banned: 0,
					admins: 0,
					new: 0,
				},
				error: 'API server currently unavailable' } };
		}
	}
}