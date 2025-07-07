import { faCheck, faClock, faDownload, faFolderTree, faHardDrive, faImage, faMemory, faQuestion, faX } from '@fortawesome/free-solid-svg-icons';
import AdminDatabaseBackupCard from '@/components/Cards/AdminDatabaseBackup';
import { convertMiliseconds, format, formatBytes, headers } from '@/utils/functions';
import { Row, Col, InfoPill, InfoPillProgress, ErrorPopup } from '@/components';
import { AdminCRONJobCard } from '@/components/Cards/AdminCRONJob';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLogFileCard from '@/components/Cards/AdminLogFile';
import AdminCacheCard from '@/components/Cards/AdminCache';
import type { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { DatabaseBackup } from '@/types';
import { User } from 'better-auth';
import axios from 'axios';
import AdminUserAgentCard from '@/components/Cards/AdminUserAgentCard';

interface Props {
  error: string
	thumbnailCache: {
		sizeInBytes: number
		count: number
	}
	stats: {
		memory: {
			using: number
			total: number
		},
		uptime: number
		logs: {
			totalByteSize: number
			count: number
		},
		backup: DatabaseBackup | Record<never, never>
  }
}

export default function AdminEndpoints({ thumbnailCache, stats, error }: Props) {
	const { data: session } = authClient.useSession();
	if (session == null) return null;

	const latestBackupStats = {
		text: 'createdAt' in stats.backup ? format(new Date().getTime() - (new Date().getTime() - new Date(stats.backup.createdAt).getTime())) : '0',
		icon: 'createdAt' in stats.backup ? (stats.backup?.status == 'success' ? faCheck : faX) : faQuestion,
	};

	return (
		<AdminLayout activeTab='logs' user={session.user as User} tabName='Admin System'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">System Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			{error && <ErrorPopup text={error} />}
			<Row>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Latest Backup Status'} text={latestBackupStats.text} icon={latestBackupStats.icon} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Log File Size'} text={`${formatBytes(stats.logs.totalByteSize)} (${stats.logs.count})`} icon={faFolderTree} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Thumbnail Cache Size'} text={`${formatBytes(thumbnailCache.sizeInBytes)} (${thumbnailCache.count})`} icon={faImage} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPillProgress title={'RAM usage'} text={`${formatBytes(stats.memory.using)}/${formatBytes(stats.memory.total)}`} icon={faHardDrive} max={stats.memory.total} current={stats.memory.using} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Network usage (7 days)'} text={'0'} icon={faMemory} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'System Uptime'} text={convertMiliseconds(stats.uptime)} icon={faClock} />
				</Col>
			</Row>
			<Row>
				<Col lg={4}>
					<AdminDatabaseBackupCard />
				</Col>
				<Col lg={4}>
					<AdminLogFileCard />
				</Col>
				<Col lg={4}>
					<AdminCRONJobCard />
					<AdminCacheCard sizeInBytes={thumbnailCache.sizeInBytes} count={thumbnailCache.count} />
				</Col>
			</Row>
			<AdminUserAgentCard />
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
			const [{ data: { folderSize } }, { data: stats }] = await Promise.all([
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/cache/thumbnails`, headers(context.req)),
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/system/stats`, headers(context.req)),
			]);

			// Add the frontend RAM usage to total
			stats.memory.using = stats.memory.using + process.memoryUsage().heapUsed;
			return { props: { thumbnailCache: folderSize, stats } };
		} catch {
			return { props: { thumbnailCache: { sizeInBytes: 0, count: 0 }, stats: { memory: {
				using: 0,
				total: 0,
			},
			uptime: 0,
			logs: {
				totalByteSize: 0,
				count: 0,
			},
			backup: {} }, error: 'API server currently unavailable' } };
		}
	}
}