import { faDollar, faDownload, faHardDrive, faUserTag } from '@fortawesome/free-solid-svg-icons';
import AdminCustomerTrend from '@/components/Graphs/AdminCustomerTrends';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminManageSubscriptionCard } from '@/components/Cards';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { Row, Col, InfoPill } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import type { Session } from '@/auth/server';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminSystemPage() {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminSubscription'],
		queryFn: async ({ signal }) => API.ADMIN.fetchSubscriptionStats(signal),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab='subscriptions' user={session.user as Session['user']} tabName='Admin Subscriptions'>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Subscriptions Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Total earnings" text={`${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL}???`} icon={faDollar} isLoading={isLoading} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Active Subscribers" text={data?.payingUsers ?? 0} icon={faUserTag} isLoading={isLoading} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="New Subscribers (30 days)" text={data?.newCustomers ?? 0} icon={faHardDrive} isLoading={isLoading} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Most Popular Plan" text={data?.mostPopular ?? ''} icon={faHardDrive} isLoading={isLoading} />
				</Col>
			</Row>
			<AdminCustomerTrend />
			<AdminManageSubscriptionCard />
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