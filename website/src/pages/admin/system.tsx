import { faCheck, faClock, faDownload, faFolderTree, faHardDrive, faImage, faMemory, faX } from '@fortawesome/free-solid-svg-icons';
import AdminDatabaseBackupCard from '@/components/Cards/AdminDatabaseBackup';
import { convertMiliseconds, format, formatBytes } from '@/utils/functions';
import { Row, Col, InfoPill, InfoPillProgress } from '@/components';
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
		backup: DatabaseBackup
  }
}

export default function AdminEndpoints({ thumbnailCache, stats }: Props) {
	const { data: session } = authClient.useSession();
	if (session == null) return null;

	const latestBackupStats = {
		text: format(new Date().getTime() - (new Date().getTime() - new Date(stats.backup.createdAt).getTime())),
		icon: stats.backup.status == 'success' ? faCheck : faX,
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
					<AdminCacheCard sizeInBytes={thumbnailCache.sizeInBytes} count={thumbnailCache.count} />
				</Col>
				<Col lg={4}>
					<AdminLogFileCard />
				</Col>
				<Col lg={4}>
					<AdminCRONJobCard />
				</Col>
			</Row>
		</AdminLayout>
	);
}

// Fetch endpoints
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	try {
		const [{ data: { folderSize } }, { data: stats }] = await Promise.all([
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/cache/thumbnails`, {
				headers: { cookie: ctx.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/system/stats`, {
				headers: { cookie: ctx.req.headers.cookie },
			}),
		]);

		// Add the frontend RAM usage to total
		stats.memory.using = stats.memory.using + process.memoryUsage().heapUsed;
		return { props: { thumbnailCache: folderSize, stats } };
	} catch {
		return { props: { thumbnailCache: {}, stats: { memory: {} }, error: 'API server currently unavailable' } };
	}
}
