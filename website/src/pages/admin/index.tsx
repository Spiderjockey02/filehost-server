import { faDownload, faUsers, faHardDrive, faFolderTree } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, InfoPill, UserGrowthLineChart, FileUploadLineChart } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminListRecentUploadsCard } from '@/components/Cards';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/auth/server';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminPage() {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminHome'],
		queryFn: async ({ signal }) => API.ADMIN.fetchAdminStats(signal),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab="dashboard" user={session.user as Session['user']} tabName="Admin Dashboard">
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Admin Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Total Users (Active)" text={`${data?.users.total} (${data?.users.active})`} icon={faUsers} isLoading={isLoading} />
				</Col>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Total files" text={data?.storage.totalFiles ?? 0} icon={faFolderTree} isLoading={isLoading} />
				</Col>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="System Health" text="True" icon={faHardDrive} isLoading={isLoading} />
				</Col>
			</Row>
			<Row className="mb-4">
				<Col lg={6}>
					<UserGrowthLineChart />
				</Col>
				<Col lg={6}>
					<FileUploadLineChart />
				</Col>
			</Row>
			<AdminListRecentUploadsCard />
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