import { faDownload, faUsers, faHardDrive, faFolderTree } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, InfoPill, LineChart, Card, ErrorPopup } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { GetServerSidePropsContext } from 'next';
import type { AdminPageProps } from '@/types/pages';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import axios from 'axios';
import { useState } from 'react';
import { User } from 'better-auth';
import AdminRecentUploadsCards from '@/components/Cards/AdminRecentUploads';
import { auth } from '@/auth/server';

type growthGraphType = 'daily' | 'monthly' | 'yearly'

export default function Files({ stats, rawUserGrowth, rawUploadGrowth, error }: AdminPageProps) {
	const { data: session } = authClient.useSession();
	const [userGrowth, setUserGrowth] = useState(rawUserGrowth);
	const [userGrowthFrame, setUserGrowthFrame] = useState<growthGraphType>('monthly');
	const [uploadGrowth, setUploadGrowth] = useState(rawUploadGrowth);
	const [uploadGrowthFrame, setUploadGrowthFrame] = useState<growthGraphType>('daily');

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

	const fileUploadData = {
		labels: Object.keys(uploadGrowth),
		datasets: [
			{
				label: 'Total files',
				data: Object.values(uploadGrowth),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

	async function updatedUserJoinGrowth(time: 'daily' | 'monthly' | 'yearly') {
		try {
			const { data: p } = await axios.get(`/api/admin/users/growth?frame=${time}`);
			const keys = Object.keys(p);
			setUserGrowth(p[keys[0]]);
			setUserGrowthFrame(time);
		} catch (err) {
			console.log(err);
		}
	}

	async function updatedUploadGrowth(time: 'daily' | 'monthly' | 'yearly') {
		try {
			const { data: p } = await axios.get(`/api/admin/files/growth?frame=${time}`);
			const keys = Object.keys(p);
			setUploadGrowth(p[keys[0]]);
			setUploadGrowthFrame(time);
		} catch (err) {
			console.log(err);
		}
	}

	if (session == null) return null;
	return (
		<AdminLayout activeTab='dashboard' user={session.user as User} tabName='Admin Dashboard'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Admin Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			{error && <ErrorPopup text={error} />}
			<Row>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title={'Total Users (Active)'} text={`${stats.users.total} (${stats.users.active})`} icon={faUsers} />
				</Col>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title={'Total files'} text={stats.storage.totalFiles} icon={faFolderTree} />
				</Col>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title={'System Health'} text={'True'} icon={faHardDrive} />
				</Col>
			</Row>
			<Row className='mb-4'>
				<Col lg={6}>
					<Card>
						<Card.Header>
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
						</Card.Header>
						<Card.Body>
							<LineChart data={userJoinData} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</Card.Body>
					</Card>
				</Col>
				<Col lg={6}>
					<Card>
						<Card.Header>
							File Uploads Over Time
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
									{uploadGrowthFrame}
								</button>
								<ul className="dropdown-menu dropdown-menu-end">
									<li><a className="dropdown-item" href="#" onClick={() => updatedUploadGrowth('daily')}>Daily</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedUploadGrowth('monthly')}>Monthly</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedUploadGrowth('yearly')}>Yearly</a></li>
								</ul>
							</div>
						</Card.Header>
						<Card.Body>
							<LineChart data={fileUploadData} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Row>
				<Col xl={8} md={12} className='mb-4'>
					<AdminRecentUploadsCards />
				</Col>
			</Row>
		</AdminLayout>
	);
}

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
		// Validate path
		try {
			const [{ data: stats }, { data: { months } }, { data: { days } }] = await Promise.all([
			// For the top bar of stats
			 axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/stats`, {
					headers: { cookie: context.req.headers.cookie },
				}),

				// Show user growth monthly (12 months)
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/growth?frame=monthly`, {
					headers: { cookie: context.req.headers.cookie },
				}),

				// Show files uploaded daily (14 days)
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/files/growth?frame=daily`, {
					headers: { cookie: context.req.headers.cookie },
				}),
			]);
			return { props: { stats, rawUserGrowth: months, rawUploadGrowth: days } };
		} catch (err) {
			console.log(err);
			return { props: { stats: {
				users: { total: 0, active: 0 },
				storage: { totalFiles: 0 },
			}, rawUserGrowth: {}, rawUploadGrowth: {}, error: 'API server currently unavailable' } };
		}
	}
}