import { AdminListActivitiesCard, AdminListRecentUploadsCard, AdminListSessionsCard, AdminManageUserCard, AdminManageUserNotficationsCard } from '@/components/Cards';
import { useToast } from '@/components/Hooks/ToastManager';
import type { AdminUserIdPageProps } from '@/types/pages';
import type { GetServerSidePropsContext } from 'next';
import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import type { UserBans } from '@prisma/client';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import type { AdminUser } from '@/types';
import type { User } from 'better-auth';
import { Col, Row } from '@/components';
import { useEffect } from 'react';

export default function AdminUserIdPage({ userId }: AdminUserIdPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminUser', userId],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/users/${userId}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch user information: ${res.statusText}`);

			const d = await res.json();
			return d as { user: AdminUser, bannedStatus: UserBans | null };
		},
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab="users" user={session.user as User} tabName={`Admin user: ${data?.user.name}`}>
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
			<AdminManageUserNotficationsCard userId={userId} />
		</AdminLayout>
	);
};

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
		const userId = context.params?.id;
		return { props: { userId } };
	}
}