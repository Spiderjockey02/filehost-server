import { Card, Col, InfoPill, Row, ActivityTransferAreaChart, ObjectOrientedPieChart } from '@/components';
import { faDownload, faEarthEurope, faStopwatch, faUpload } from '@fortawesome/free-solid-svg-icons';
import { AdminListActivitiesCard, AdminListUserAgentsCard } from '@/components/Cards';
import NetworkRequestsLineChart from '@/components/Graphs/NetworkRequestsLineChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatBytes, queryOptions } from '@/utils/functions';
import { useToast } from '@/components/Hooks/ToastManager';
import { useQuery } from '@tanstack/react-query';
import { GetServerSidePropsContext } from 'next';
import type { PageProps } from '@/types/pages';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';
import Link from 'next/link';

export default function AdminNetworkPage({ user }: PageProps) {
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminNetwork'],
		queryFn: async ({ signal }) => Promise.all([
			API.ADMIN.fetchNetworkStats(signal),
			API.ADMIN.fetchNetworkStatusDistribution(signal, new URLSearchParams('interval=daily')),
		]),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	return (
		<AdminLayout user={user} activeTab='network' tabName='Admin File'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Network Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title="Total Incoming Bytes" text={formatBytes(data?.[0].network.incomingBytes)} icon={faDownload} isLoading={isLoading} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title="Total Outgoing Bytes" text={formatBytes(data?.[0].network.outgoingBytes)} icon={faUpload} isLoading={isLoading} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title="Average Duration" text={`${Number.parseFloat(`${data?.[0].duration}`).toFixed(1)}ms`} icon={faStopwatch} isLoading={isLoading} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title="Total Requests" text={`${data?.[0].total}`} icon={faEarthEurope} isLoading={isLoading} />
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
							{error ?
								<div className="alert alert-danger" role="alert">
									{error.message}
								</div>
								: <ObjectOrientedPieChart data={(data?.[0].methods ?? []).reduce((acc: {[key: string]: number}, item) => {
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
							{error ?
								<div className="alert alert-danger" role="alert">
									{error.message}
								</div>
								: <ObjectOrientedPieChart data={(data?.[0].status ?? []).reduce((acc: {[key: number]: number}, item) => {
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
		return { props: { user: data.user } };
	}
}