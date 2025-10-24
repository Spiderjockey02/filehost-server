import { authClient } from '@/auth/client';
import { Row, Col, InfoPill, ObjectOrientedPieChart, Card } from '@/components';
import AdminAuditListenersCard from '@/components/Cards/AdminAuditListenersCard';
import AdminAuditLogTableCard from '@/components/Cards/AdminAuditLogTableCard';
import AuditLogActivityChart from '@/components/Graphs/AuditLogActivityChart';
import AdminLayout from '@/layouts/admin';
import { headers } from '@/utils/functions';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { User } from 'better-auth';
import { GetServerSidePropsContext } from 'next';

interface Props {
	total: number;
	resourceTypes: {
		user: number
		file: number
		storage: number
		system: number
		session: number
	}
}

export default function adminLogsPage({ total, resourceTypes }: Props) {
	const { data: session } = authClient.useSession();

	if (session == null) return null;
	return (
		<AdminLayout activeTab='network' user={session.user as User} tabName='Admin Audit Logs'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Audit logs Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={2} md={6} className='mb-4'>
					<InfoPill title="Total events" text={total} icon={faDownload} />
				</Col>
				<Col xl={2} md={6} className='mb-4'>
					<InfoPill title="User events" text={resourceTypes.user} icon={faDownload} />
				</Col>
				<Col xl={2} md={6} className='mb-4'>
					<InfoPill title="File events" text={resourceTypes.file} icon={faDownload} />
				</Col>
				<Col xl={2} md={6} className='mb-4'>
					<InfoPill title="Storage events" text={resourceTypes.storage} icon={faDownload} />
				</Col>
				<Col xl={2} md={6} className='mb-4'>
					<InfoPill title="System events" text={resourceTypes.system} icon={faDownload} />
				</Col>
				<Col xl={2} md={6} className='mb-4'>
					<InfoPill title="Session events" text={resourceTypes.session} icon={faDownload} />
				</Col>
			</Row>
			&nbsp;
			<AuditLogActivityChart />
			<Row>
				<Col lg={8}>
					<AdminAuditListenersCard />
				</Col>
				<Col lg={4}>
					<Card>
						<Card.Header>Event Distribution</Card.Header>
						<Card.Body>
							<ObjectOrientedPieChart data={resourceTypes} />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<AdminAuditLogTableCard />
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
			const [{ data: stats }, { data: resourceData }] = await Promise.all([
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/logs`, headers(context.req)),
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/logs/types`, headers(context.req)),
			]);

			return { props: { total: stats.total, resourceTypes: resourceData.resourceTypes } };
		} catch (err) {
			console.log(err);
			return { props: { total: 0, error: 'API server currently unavailable' } };
		}
	}
}