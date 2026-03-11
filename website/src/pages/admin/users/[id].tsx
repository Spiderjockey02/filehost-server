import { AdminListActivitiesCard, AdminListRecentUploadsCard, AdminListSessionsCard, AdminManageUserCard, AdminManageUserNotficationsCard } from '@/components/Cards';
import NetworkRequestsLineChart from '@/components/Graphs/NetworkRequestsLineChart';
import { ActivityTransferAreaChart, Col, Row } from '@/components';
import { useToast } from '@/components/Hooks/ToastManager';
import type { AdminUserIdPageProps } from '@/types/pages';
import type { GetServerSidePropsContext } from 'next';
import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/auth/server';
import { authClient } from '@/auth/client';
import { notFound } from 'next/navigation';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminUserIdPage({ userId }: AdminUserIdPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminUser', userId],
		queryFn: async ({ signal }) => API.ADMIN.fetchUserById(signal, userId),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab="users" user={session.user as Session['user']} tabName={`Admin user: ${data?.user.name}`}>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">User: {data?.user.name}</h1>
			</div>
			<Row>
				<Col lg={4}>
					<AdminManageUserCard isLoading={isLoading} user={data?.user ?? null} bannedStatus={data?.bannedStatus ?? null} isCurrentUser={data?.user.id === session.user?.id} />
				</Col>
				<Col lg={8}>
					<AdminListSessionsCard userId={userId} isAdmin={true} />
				</Col>
			</Row>
			<Row>
				<Col lg={5}>
					<AdminListRecentUploadsCard userId={userId} />
				</Col>
				<Col lg={7}>
					<AdminListActivitiesCard userId={userId} />
				</Col>
			</Row>
			<Row>
				<Col xl={6} className='mb-4'>
					<NetworkRequestsLineChart userId={userId} />
				</Col>
				<Col xl={6} className='mb-4'>
					<ActivityTransferAreaChart userId={userId} />
				</Col>
			</Row>
			<AdminManageUserNotficationsCard userId={userId} />
		</AdminLayout>
	);
};

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
		const userId = context.params?.id;
		if (typeof userId !== 'string') return notFound();
		return { props: { userId } };
	}
}