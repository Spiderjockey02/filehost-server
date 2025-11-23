import { faDownload, faUsers, faHardDrive, faFolderTree } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, InfoPill, UserGrowthLineChart, FileUploadLineChart } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminListRecentUploadsCard } from '@/components/Cards';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import type { AdminPageProps } from '@/types/pages';
import { headers } from '@/utils/functions';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { User } from 'better-auth';
import { useEffect } from 'react';
import axios from 'axios';

export default function AdminPage({ stats, error }: AdminPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	useEffect(() => {
		if (error) showToast('error', error);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab="dashboard" user={session.user as User} tabName="Admin Dashboard">
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Admin Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Total Users (Active)" text={`${stats.users.total} (${stats.users.active})`} icon={faUsers} />
				</Col>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Total files" text={stats.storage.totalFiles} icon={faFolderTree} />
				</Col>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="System Health" text="True" icon={faHardDrive} />
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
			const { data: stats } = await axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/stats`, headers(context.req));
			return { props: { stats } };
		} catch (err) {
			console.log(err);
			return { props: {
				stats: {
					users: { total: 0, active: 0 },
					storage: { totalFiles: 0 },
				},
				error: 'API server currently unavailable',
			} };
		}
	}
}