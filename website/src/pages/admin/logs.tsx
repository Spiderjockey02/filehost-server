import { AdminListAuditLogsCard, AdminManageLogListenersCard } from '@/components/Cards';
import { Row, Col, InfoPill, ObjectOrientedPieChart, Card } from '@/components';
import AuditLogActivityChart from '@/components/Graphs/AuditLogActivityChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/components/Hooks/ToastManager';
import type { AdminLogsPageProps } from '@/types/pages';
import { GetServerSidePropsContext } from 'next';
import { headers } from '@/utils/functions';
import AdminLayout from '@/layouts/admin';
import { authClient } from '@/auth/client';
import type { User } from 'better-auth';
import { useEffect } from 'react';
import axios from 'axios';

export default function AdminLogsPage({ error, total, resourceTypes, successRates }: AdminLogsPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	useEffect(() => {
		if (error) showToast('error', error);
	}, [error]);

	const mostPopularEventType = Object.entries(resourceTypes).sort((a, b) => a[1] - b[1])[0][0];
	const successRatesPercent = ((successRates.true / (successRates.true + successRates.false)) * 100).toFixed(2);

	if (session == null) return null;
	return (
		<AdminLayout activeTab='logs' user={session.user as User} tabName='Admin Audit Logs'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Audit logs Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title="Total events" text={total} icon={faDownload} />
				</Col>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title="Success rate" text={`${successRatesPercent}%`} icon={faDownload} />
				</Col>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title="Most popular event" text={mostPopularEventType} icon={faDownload} />
				</Col>
			</Row>
			&nbsp;
			<AuditLogActivityChart />
			<Row>
				<Col lg={8} className='mb-4'>
					<AdminManageLogListenersCard />
				</Col>
				<Col lg={4} className='mb-4'>
					<Card>
						<Card.Header>Event Distribution</Card.Header>
						<Card.Body>
							{error ?
								<div className="alert alert-danger" role="alert">
									{error}
								</div>
								: <ObjectOrientedPieChart data={resourceTypes} />
							}
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<AdminListAuditLogsCard />
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

			return { props: { total: stats.total, resourceTypes: resourceData.resourceTypes, successRates: resourceData.successRates } };
		} catch (err) {
			console.log(err);
			return { props: { total: 0,
				resourceTypes: {
					user: 0,
					file: 0,
					storage: 0,
					system: 0,
					session: 0,
				},
				successRates: {
					true: 0,
					false: 0,
				}, error: 'API server currently unavailable' } };
		}
	}
}