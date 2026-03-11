import { AdminListLogFilesCard, AdminManageCacheCard, AdminManageConfigCard, AdminManageCRONjobsCard, AdminManageDatabaseBackupsCard } from '@/components/Cards';
import { faClock, faDownload, faFolderTree, faHardDrive, faMemory } from '@fortawesome/free-solid-svg-icons';
import { convertMiliseconds, formatBytes, queryOptions } from '@/utils/functions';
import { Row, Col, InfoPill, InfoPillProgress } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/auth/server';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminSystemPage() {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminSystem'],
		queryFn: async ({ signal }) => API.ADMIN.fetchSystemStats(signal),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab='system' user={session.user as Session['user']} tabName='Admin System'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">System Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col lg={3} md={6} className="mb-4">
					<InfoPill title="Log File Size" text={`${formatBytes(data?.logs.totalByteSize)} (${data?.logs.count})`} icon={faFolderTree} isLoading={isLoading} />
				</Col>
				<Col lg={3} md={6} className="mb-4">
					<InfoPillProgress title="RAM usage" text={`${formatBytes(data?.memory.using)}/${formatBytes(data?.memory.total)}`} icon={faHardDrive} max={data?.memory.total ?? 0} current={data?.memory.using ?? 0} isLoading={isLoading} />
				</Col>
				<Col lg={3} md={6} className="mb-4">
					<InfoPill title="Network usage (7 days)" text={formatBytes(data?.network)} icon={faMemory} isLoading={isLoading} />
				</Col>
				<Col lg={3} md={6} className="mb-4">
					<InfoPill title="System Uptime" text={convertMiliseconds(data?.uptime ?? 0)} icon={faClock} isLoading={isLoading} />
				</Col>
			</Row>
			<Row>
				<Col lg={4}>
					<AdminManageConfigCard />
				</Col>
				<Col lg={4}>
					<AdminManageDatabaseBackupsCard />
					<AdminManageCRONjobsCard />
				</Col>
				<Col lg={4}>
					<AdminListLogFilesCard />
					<AdminManageCacheCard />
				</Col>
			</Row>
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