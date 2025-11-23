import { faDollar, faDownload, faHardDrive, faUserTag } from '@fortawesome/free-solid-svg-icons';
import AdminCustomerTrend from '@/components/Graphs/AdminCustomerTrends';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminManageSubscriptionCard } from '@/components/Cards';
import type { AdminSubscriptionPageProps } from '@/types/pages';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { Row, Col, InfoPill } from '@/components';
import { headers } from '@/utils/functions';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import type { User } from 'better-auth';
import { useEffect } from 'react';
import axios from 'axios';

export default function AdminSystemPage({ stats, error }: AdminSubscriptionPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	useEffect(() => {
		if (error) showToast('error', error);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab='subscriptions' user={session.user as User} tabName='Admin Subscriptions'>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Subscriptions Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Total earnings" text={`${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL}???`} icon={faDollar} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Active Subscribers" text={stats.payingUsers} icon={faUserTag} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="New Subscribers (30 days)" text={stats.newCustomers} icon={faHardDrive} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Most Popular Plan" text={stats.mostPopular} icon={faHardDrive} />
				</Col>
			</Row>
			<AdminCustomerTrend />
			<AdminManageSubscriptionCard />
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
			const { data: stats } = await axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/plan/stats`, headers(context.req));
			return { props: { stats } };
		} catch (err) {
			console.log(err);
			return { props: { stats: { payingUsers: 0, newCustomers: 0, mostPopular: 0 }, error: 'API server currently unavailable' } };
		}
	}
}