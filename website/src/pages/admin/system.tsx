import { faClock, faDownload, faFolderTree, faHardDrive, faMemory } from '@fortawesome/free-solid-svg-icons';
import AdminDatabaseBackupCard from '@/components/Cards/AdminDatabaseBackup';
import { convertMiliseconds, formatBytes, headers } from '@/utils/functions';
import { Row, Col, InfoPill, InfoPillProgress, ErrorPopup } from '@/components';
import { AdminCRONJobCard } from '@/components/Cards/AdminCRONJob';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLogFileCard from '@/components/Cards/AdminLogFile';
import AdminCacheCard from '@/components/Cards/AdminCache';
import type { GetServerSidePropsContext } from 'next';
import { AdminSystemPageProps } from '@/types/pages';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { User } from 'better-auth';
import axios from 'axios';
import AdminConfigCard from '@/components/Cards/AdminConfig';

export default function AdminSystemPage({ stats, error }: AdminSystemPageProps) {
	const { data: session } = authClient.useSession();
	if (session == null) return null;

	return (
		<AdminLayout activeTab='system' user={session.user as User} tabName='Admin System'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">System Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			{error && <ErrorPopup text={error} />}
			<Row>
				<Col lg={3} md={6} className="mb-4">
					<InfoPill title="Log File Size" text={`${formatBytes(stats.logs.totalByteSize)} (${stats.logs.count})`} icon={faFolderTree} />
				</Col>
				<Col lg={3} md={6} className="mb-4">
					<InfoPillProgress title="RAM usage" text={`${formatBytes(stats.memory.using)}/${formatBytes(stats.memory.total)}`} icon={faHardDrive} max={stats.memory.total} current={stats.memory.using} />
				</Col>
				<Col lg={3} md={6} className="mb-4">
					<InfoPill title="Network usage (7 days)" text={formatBytes(stats.network)} icon={faMemory} />
				</Col>
				<Col lg={3} md={6} className="mb-4">
					<InfoPill title="System Uptime" text={convertMiliseconds(stats.uptime)} icon={faClock} />
				</Col>
			</Row>
			<Row>
				<Col lg={4}>
					<AdminConfigCard />
				</Col>
				<Col lg={4}>
					<AdminDatabaseBackupCard />
					<AdminCRONJobCard />
				</Col>
				<Col lg={4}>
					<AdminLogFileCard />
					<AdminCacheCard />
				</Col>
			</Row>
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
			const { data: stats } = await axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/system/stats`, headers(context.req));

			// Add the frontend RAM usage to total
			stats.memory.using = stats.memory.using + process.memoryUsage().heapUsed;
			return { props: { stats } };
		} catch {
			return { props: { stats: { memory: {
				using: 0,
				total: 0,
			},
			uptime: 0,
			logs: {
				totalByteSize: 0,
				count: 0,
			},
			network: 0,
			backup: {} }, error: 'API server currently unavailable' } };
		}
	}
}