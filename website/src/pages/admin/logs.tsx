import { AdminListAuditLogsCard, AdminManageLogListenersCard } from '@/components/Cards';
import { Row, Col, InfoPill, ObjectOrientedPieChart, Card } from '@/components';
import AuditLogActivityChart from '@/components/Graphs/AuditLogActivityChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/components/Hooks/ToastManager';
import { useQuery } from '@tanstack/react-query';
import { GetServerSidePropsContext } from 'next';
import { queryOptions } from '@/utils/functions';
import type { PageProps } from '@/types/pages';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminLogsPage({ user }: PageProps) {
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminUser'],
		queryFn: async ({ signal }) => Promise.all([API.ADMIN.fetchLogs(signal), API.ADMIN.fetchLogTypes(signal)]),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	const mostPopularEventType = Object.entries(data?.[1].resourceTypes ?? {}).sort((a, b) => a[1] - b[1])[0]?.[0];
	const successRatesPercent = data ? ((data[1].successRates.true / (data[1].successRates.true + data[1].successRates.false)) * 100).toFixed(2) : '0';

	return (
		<AdminLayout user={user} activeTab='logs' tabName='Admin Audit Logs'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Audit logs Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title="Total events" text={data?.[0].total ?? '0'} icon={faDownload} isLoading={isLoading} />
				</Col>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title="Success rate" text={`${successRatesPercent}%`} icon={faDownload} isLoading={isLoading} />
				</Col>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title="Most popular event" text={mostPopularEventType} icon={faDownload} isLoading={isLoading} />
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
									{error.message}
								</div>
								: <ObjectOrientedPieChart data={data?.[1].resourceTypes ?? {}} />
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