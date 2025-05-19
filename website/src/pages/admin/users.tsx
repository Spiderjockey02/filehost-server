import type { AdminUserPageProps } from '@/types/pages';
import type { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import type { User } from 'better-auth';
import axios from 'axios';
import AdminLayout from '@/layouts/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFolderTree, faHardDrive, faMemory, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Row, Col, InfoPill, LineChart } from '@/components';
import { formatBytes } from '@/utils/functions';
import { ObjectOrientedPieChart } from '@/components/Graphs/ObjectOrientedPieChart';
import { useState } from 'react';
import AdminUserTableCards from '@/components/Cards/AdminUserTable';
type growthGraphType = 'daily' | 'monthly' | 'yearly'

export default function Files({ langaugeCodes, emails, rawUserGrowth, newUsers, signupSource, retention, userStats }: AdminUserPageProps) {
	// Make sure user is logged in before accessing page
	const { data: session } = authClient.useSession();
	const [userGrowth, setUserGrowth] = useState(rawUserGrowth);
	const [userGrowthFrame, setUserGrowthFrame] = useState<growthGraphType>('monthly');

	const userJoinData = {
		labels: Object.keys(userGrowth),
		datasets: [
			{
				label: 'User count',
				data: Object.values(userGrowth),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

	const userRetentionData = {
		labels: Object.keys(retention.files),
		datasets: [
			{
				label: 'File count',
				data: Object.values(retention.files),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
			{
				label: 'Session count',
				data: Object.values(retention.sessions),
				borderColor: 'rgb(8, 99, 132)',
				backgroundColor: 'rgba(8, 99, 132, 0.5)',
			},
		],
	};

	const userRetentionOptions = {
		responsive: true,
		maintainAspectRatio: false,
		aspectRatio: 2,
		scales: {
			y: {
				ticks: {
					callback: function(value: string | number) {
						return `${(Number(value) * 100).toFixed(0)}%`;
					},
				},
				beginAtZero: true,
				max: 1,
			},
		},
	};

	async function updatedUserJoinGrowth(time: 'daily' | 'monthly' | 'yearly') {
		try {
			const { data: p } = await axios.get(`/api/admin/users/growth?frame=${time}`);
			const keys = Object.keys(p);
			setUserGrowth(p[keys[0]]);
			setUserGrowthFrame(time);
		} catch (error) {
			console.log(error);
		}
	}

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
			<Row>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Total Users'} text={userStats.total} icon={faUsers} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'New users (7 days)'} text={newUsers} icon={faFolderTree} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Active users (7 days)'} text={'0'} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Average Storage Used'} text={formatBytes(userStats.avgstorageUsage)} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Banned users'} text={userStats.banned} icon={faMemory} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Admins'} text={userStats.admins} icon={faMemory} />
				</Col>
			</Row>
			<Row>
				<Col lg={6}>
					<div className="card mb-4">
						<h5 className="card-header d-flex flex-row align-items-center justify-content-between">
							User Growth Over Time
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
									{userGrowthFrame}
								</button>
								<ul className="dropdown-menu dropdown-menu-end">
									<li><a className="dropdown-item" href="#" onClick={() => updatedUserJoinGrowth('daily')}>Daily</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedUserJoinGrowth('monthly')}>Monthly</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedUserJoinGrowth('yearly')}>Yearly</a></li>
								</ul>
							</div>
						</h5>
						<div className="card-body">
							<LineChart data={userJoinData} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</div>
					</div>
				</Col>
				<Col lg={6}>
					<div className="card mb-4">
						<h5 className="card-header d-flex flex-row align-items-center justify-content-between">
							User Rention Over Time
						</h5>
						<div className="card-body">
							<LineChart data={userRetentionData} options={userRetentionOptions} style={{ height: '400px' }} />
						</div>
					</div>
				</Col>
			</Row>
			<Row>
				<Col lg={4} className='mb-4'>
					<div className="card">
						<h5 className="card-header">Language Distribution</h5>
						<div className="card-body d-flex justify-content-center">
							<ObjectOrientedPieChart data={langaugeCodes} />
						</div>
					</div>
				</Col>
				<Col lg={4} className='mb-4'>
					<div className="card">
						<h5 className="card-header">Sign up sources</h5>
						<div className="card-body d-flex justify-content-center">
							<ObjectOrientedPieChart data={signupSource} />
						</div>
					</div>
				</Col>
				<Col lg={4} className='mb-4'>
					<div className="card">
						<h5 className="card-header">Email domains Distribution</h5>
						<div className="card-body d-flex justify-content-center">
							<ObjectOrientedPieChart data={emails} />
						</div>
					</div>
				</Col>
			</Row>
			<div className="card mb-4">
				<h5 className="card-header">All users</h5>
				<div className="card-body">
					<AdminUserTableCards />
				</div>
			</div>
		</AdminLayout>
	);
}
export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Validate path
	try {
		const [{ data: { days } }, { data: { langaugeCodes } }, { data: { emails } }, { data: { months } }, { data: { signupSource } }, { data: { retention } }, { data: userStats }] = await Promise.all([
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/growth?frame=daily`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/language-codes`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/emails`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/growth?frame=monthly`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/signup-source`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/retention`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/stats`, {
				headers: { cookie: context.req.headers.cookie },
			}),
		]);

		const values = Object.values<number>(days);
		const max = Math.max(...values);
		const min = Math.min(...values);
		const newUsers = max - min;

		return { props: { newUsers, langaugeCodes, emails, rawUserGrowth: months, signupSource, retention, userStats } };
	} catch (err) {
		console.log(err);
		return {
			redirect: {
				destination: '/files',
				permanent: false,
			},
		};
	}
}
