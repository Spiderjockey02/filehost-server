import { authClient } from '@/auth/client';
import { Card, Col, ErrorPopup, InfoPill, LineChart, PieChart, Row } from '@/components';
import AdminActivityCard from '@/components/Cards/AdminActivity';
import { ActivityTransferAreaChart } from '@/components/Graphs/ActivityTransferAreaChart';
import AdminLayout from '@/layouts/admin';
import { StringNumberObj } from '@/types';
import { requestTimeFrames } from '@/types/pages';
import { formatBytes, getRandomColor, headers } from '@/utils/functions';
import { faDownload, faEarthEurope, faStopwatch, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { User } from 'better-auth';
import { GetServerSidePropsContext } from 'next';
import Link from 'next/link';
import { useState } from 'react';

interface Methods {
	method: string
	count: number
}

interface Status {
	status: number
	count: number
}

interface Props {
  error?: string
	network: {
		incomingBytes: number
		outgoingBytes: number
	}
	methods: Methods[]
	status: Status[]
	duration: number
	total: number
	history: StringNumberObj
	requests: {
		[hour: string]: {
    	incomingBytes: number;
    	outgoingBytes: number;
  	}
	}
}

export default function AdminNetwork(data: Props) {
	const { data: session } = authClient.useSession();
	const [requestGrowth, setRequestGrowth] = useState(data.history);
	const [requestGrowthFrame, setRequestGrowthFrame] = useState<requestTimeFrames>('hourly');

	const [trafficGrowth, setTrafficGrowth] = useState(data.requests);
	const [trafficGrowthFrame, setTrafficGrowthFrame] = useState<requestTimeFrames>('hourly');

	const fileCategory = {
		labels: data.methods.map(m => m.method),
		datasets: [
			{
				label: 'Number of requests',
				data: data.methods.map(m => m.count),
				backgroundColor: Array.from({ length: 10 }, getRandomColor),
			},
		],
	};

	const asd = {
		labels: data.status.map(m => m.status),
		datasets: [
			{
				label: 'Number of requests',
				data: data.status.map(m => m.count),
				backgroundColor: Array.from({ length: 10 }, getRandomColor),
			},
		],
	};

	const RequestsOverTimeData = {
		labels: Object.keys(requestGrowth),
		datasets: [
			{
				label: 'Activities',
				data: Object.values(requestGrowth),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

	async function updatedRequestGrowth(time: requestTimeFrames) {
		if (time === requestGrowthFrame) return;
		try {
			const { data: p } = await axios.get(`/api/admin/network/growth?frame=${time}`);
			const keys = Object.keys(p);
			setRequestGrowth(p[keys[0]]);
			setRequestGrowthFrame(time);
		} catch (err) {
			console.log(err);
		}
	}

	async function updatedTrafficGrowth(time: requestTimeFrames) {
		if (time === trafficGrowthFrame) return;
		try {
			const { data: p } = await axios.get(`/api/admin/network/traffic?frame=${time}`);
			const keys = Object.keys(p);
			setTrafficGrowth(p[keys[0]]);
			setTrafficGrowthFrame(time);
		} catch (err) {
			console.log(err);
		}
	}

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
			{data.error && <ErrorPopup text={data.error} />}
			<Row>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title={'Total Incoming Bytes'} text={formatBytes(data.network.incomingBytes)} icon={faDownload} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title={'Total Outgoing Bytes'} text={formatBytes(data.network.outgoingBytes)} icon={faUpload} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title={'Average Duration'} text={`${Number.parseFloat(`${data.duration}`).toFixed(1)}ms`} icon={faStopwatch} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title={'Total Requests'} text={data.total} icon={faEarthEurope} />
				</Col>
			</Row>
			<Row>
				<Col xl={6}>
					<Card>
						<Card.Header>
							Requests over time
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
									{requestGrowthFrame}
								</button>
								<ul className="dropdown-menu dropdown-menu-end">
									<li><a className="dropdown-item" href="#" onClick={() => updatedRequestGrowth('yearly')}>Yearly</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedRequestGrowth('monthly')}>Monthly</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedRequestGrowth('daily')}>Daily</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedRequestGrowth('hourly')}>Hourly</a></li>
								</ul>
							</div>
						</Card.Header>
						<Card.Body>
							<LineChart data={RequestsOverTimeData} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</Card.Body>
					</Card>
				</Col>
				<Col xl={6}>
					<Card>
						<Card.Header>
							Traffic over time
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
									{requestGrowthFrame}
								</button>
								<ul className="dropdown-menu dropdown-menu-end">
									<li><a className="dropdown-item" href="#" onClick={() => updatedTrafficGrowth('yearly')}>Yearly</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedTrafficGrowth('monthly')}>Monthly</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedTrafficGrowth('daily')}>Daily</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedTrafficGrowth('hourly')}>Hourly</a></li>
								</ul>
							</div>
						</Card.Header>
						<Card.Body>
							<ActivityTransferAreaChart data={trafficGrowth} />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Row>
				<Col xxl={6} xl={6} lg={12} md={12} className='mb-4'>
					<Card>
						<Card.Header>
							<Link href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods" className='fw-bold' target='_blank'>Method Distribution</Link>
						</Card.Header>
						<Card.Body>
							<PieChart data={fileCategory} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</Card.Body>
					</Card>
				</Col>
				<Col xxl={6} xl={6} lg={12} md={12} className='mb-4'>
					<Card>
						<Card.Header>
							<Link href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status" className='fw-bold' target='_blank'>Status Code Distribution</Link>
						</Card.Header>
						<Card.Body>
							<PieChart data={asd} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<AdminActivityCard />
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
			const [{ data: stats }, { data: history }, { data: requestHistory }] = await Promise.all([
				// For the top bar of stats
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/network/stats`, headers(context.req)),
				// For the Requests Over Time
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/network/requests?frame=hourly`, headers(context.req)),

				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/network/traffic?frame=hourly`, headers(context.req)),
			]);

			return { props: { network: stats.network, methods: stats.methods, status: stats.status, duration: stats.duration, total: stats.total, history: history.hours, requests: requestHistory.hours } };
		} catch (err) {
			console.log(err);
			return { props: { network: { incomingBytes: 0,
				outgoingBytes: 0 }, methods: {}, status: {}, error: 'API server currently unavailable' } };
		}
	}
}