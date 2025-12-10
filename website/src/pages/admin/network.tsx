import { Card, Col, InfoPill, Row, ActivityTransferAreaChart, ObjectOrientedPieChart } from '@/components';
import { faDownload, faEarthEurope, faStopwatch, faUpload } from '@fortawesome/free-solid-svg-icons';
import { AdminListActivitiesCard, AdminListUserAgentsCard } from '@/components/Cards';
import NetworkRequestsLineChart from '@/components/Graphs/NetworkRequestsLineChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useToast } from '@/components/Hooks/ToastManager';
import { formatBytes, headers } from '@/utils/functions';
import { AdminNetworkPageProps } from '@/types/pages';
import { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { User } from 'better-auth';
import { useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function AdminNetworkPage(data: AdminNetworkPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	useEffect(() => {
		if (data.error) showToast('error', data.error);
	}, [data.error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab='network' user={session.user as User} tabName='Admin File'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Network Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title="Total Incoming Bytes" text={formatBytes(data.network.incomingBytes)} icon={faDownload} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title="Total Outgoing Bytes" text={formatBytes(data.network.outgoingBytes)} icon={faUpload} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title="Average Duration" text={`${Number.parseFloat(`${data.duration}`).toFixed(1)}ms`} icon={faStopwatch} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title="Total Requests" text={data.total} icon={faEarthEurope} />
				</Col>
			</Row>
			<Row>
				<Col xl={6} className='mb-4'>
					<NetworkRequestsLineChart />
				</Col>
				<Col xl={6} className='mb-4'>
					<ActivityTransferAreaChart />
				</Col>
			</Row>
			<Row>
				<Col xxl={6} xl={6} lg={12} md={12} className='mb-4'>
					<Card>
						<Card.Header>
							<Link href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods" className='fw-bold' target='_blank'>Method Distribution</Link>
						</Card.Header>
						<Card.Body>
							{data.error ?
								<div className="alert alert-danger" role="alert">
									{data.error}
								</div>
								: <ObjectOrientedPieChart data={data.methods.reduce((acc: {[key: string]: number}, item) => {
									acc[item.method] = item._count;
									return acc;
								}, {})} />
							}
						</Card.Body>
					</Card>
				</Col>
				<Col xxl={6} xl={6} lg={12} md={12} className='mb-4'>
					<Card>
						<Card.Header>
							<Link href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status" className='fw-bold' target='_blank'>Status Code Distribution</Link>
						</Card.Header>
						<Card.Body>
							{data.error ?
								<div className="alert alert-danger" role="alert">
									{data.error}
								</div>
								: <ObjectOrientedPieChart data={data.status.reduce((acc: {[key: number]: number}, item) => {
									acc[item.code] = item._count;
									return acc;
								}, {})} />
							}
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<AdminListActivitiesCard />
			<AdminListUserAgentsCard />
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
		try {
			const [{ data: stats }, { data: history }] = await Promise.all([
				// For the top bar of stats
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/network/stats`, headers(context.req)),
				// For the Requests Over Time
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/network/requests?frame=hourly`, headers(context.req)),

			]);

			return { props: { network: stats.network, methods: stats.methods, status: stats.status, duration: stats.duration, total: stats.total, history: history.hours } };
		} catch (err) {
			console.log(err);
			return { props: { network: { incomingBytes: 0,
				outgoingBytes: 0 }, methods: [], status: [], duration: 0, total: 0, history: {}, error: 'API server currently unavailable' } };
		}
	}
}