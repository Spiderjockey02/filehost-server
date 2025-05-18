import { useState } from 'react';
import type { GetServerSidePropsContext } from 'next';
import type { SyntheticEvent } from 'react';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import axios from 'axios';
import { faCheck, faCircleInfo, faDownload, faFolderTree, faHardDrive, faInfinity, faMemory, faQuestion, faTrash, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Row, Col, InfoPill, Table, InfoPillProgress } from '@/components';
import { convertMiliseconds, formatBytes } from '@/utils/functions';
import { AdminBackupModel } from '@/components/Modals/AdminBackupModal';
import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';
import { DatabaseBackup } from '@/types';
import { CronJob } from '@prisma/client';
import { AdminCRONJobLogsModal } from '@/components/Modals/AdminCRONJobLogsModal';
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

interface Props {
  error: string
  logFiles: Array<string>
	totalLogSize: number
	backups: DatabaseBackup[]
	thumbnailCache: {
		sizeInBytes: number
		count: number
	}
	stats: {
    users: {
      total: number
      active: number
    },
    storage: {
      total: number
      free: number
      totalFiles: number
    }
    memory: {
      total: number
      using: number
    }
    uptime: number
  }
	cacheStats: {
		files: {
			size: number
			max: number
			ttl: number
		}
		users: {
			size: number
			max: number
			ttl: number
		}
		userHistory: {
			size: number
			max: number
			ttl: number
		}
		sessions: {
			size: number
			max: number
			ttl: number
		}
	}
	cronJobs: CronJob[]
}

export default function AdminEndpoints({ logFiles, totalLogSize, backups, thumbnailCache, stats, cacheStats, cronJobs }: Props) {
	const { data: session } = authClient.useSession();

	const [logContent, setLogContent] = useState<string[]>([]);
	const [activeLog, setActiveLog] = useState<string>('');
	if (session == null) return null;

	// Format log files so latest is top
	const logFileNames = logFiles.sort((a, b) => {
		const extractNameA = a.match(/[0-9]{4}.[0-9]{2}.[0-9]{2}/g)?.[0];
		const extractNameB = b.match(/[0-9]{4}.[0-9]{2}.[0-9]{2}/g)?.[0];
		return new Date(extractNameB ?? '').getTime() - new Date(extractNameA ?? '').getTime();
	});

	// Update the log file content, so admin can check content of logs
	async function updateLogFileContent(e: SyntheticEvent) {
		const el = e.target as HTMLButtonElement;
		const fileName = el.innerHTML;

		try {
			const res = await fetch(`/api/admin/logs/${fileName}`, {
				method: 'get',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
			});
			const { file } = await res.json();
			setLogContent(file.reverse());
		} catch (err) {
			console.log(err);
			setLogContent(['']);
		}
		setActiveLog(fileName);
	}

	// Update log file content type (INFO, DEBUG etc)
	async function updateViewContentType(e: SyntheticEvent) {
		const el = e.target as HTMLSelectElement;

		// Fetch logs
		const res = await fetch(`/api/admin/logs/${activeLog}`, {
			method: 'get',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
		});

		// Get text from file and format it
		const { file } = await res.json() as { file: Array<string> };
		if (el.value == 'ALL') return setLogContent(file.reverse());
		setLogContent(file.reverse().filter(line => line.substring(13).startsWith(el.value)));
	}

	async function createDatabaseBackup() {
		try {
			await axios.post('/api/admin/database/backup');
		} catch (err) {
			console.log(err);
		}
	}

	async function deleteBackup(backupName: string) {
		try {
			await axios.delete(`/api/admin/database/backup/${backupName}`);
		} catch (err) {
			console.log(err);
		}
	}

	async function downloadBackup(backupName: string) {
		try {
			const res = await fetch(`/api/admin/database/backup/${backupName}`, {
				method: 'get',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
			});
			const blob = await res.blob();
			// Create blob link to download
			const url = window.URL.createObjectURL(new Blob([blob]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', backupName);

			// Add to page, click and then remove from page
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
		} catch (err) {
			console.log(err);
		}
	}

	async function deleteCache(name: string) {
		try {
			await axios.delete(`/api/admin/cache/${name}`);
		} catch (err) {
			console.log(err);
		}
	}

	async function runCronJob(name: string) {
		try {
			await axios.post(`/api/admin/cron-jobs/${name}`);
		} catch (err) {
			console.log(err);
		}
	}

	const latestBackupStats = {
		text: backups.length == 0 ? '-1' : timeAgo.format(new Date().getTime() - (new Date().getTime() - new Date(backups[0].createdAt).getTime())),
		icon: backups.length == 0 ? faQuestion : backups[0].status == 'success' ? faCheck : faX,
	};

	return (
		<AdminLayout activeTab='logs' user={session.user} tabName='Admin System'>
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
					<InfoPill title={'Log File Size'} text={`${formatBytes(totalLogSize)} (${logFiles.length})`} icon={faFolderTree} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Thumbnail Cache Size'} text={`${formatBytes(thumbnailCache.sizeInBytes)} (${thumbnailCache.count})`} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPillProgress title={'RAM usage'} text={`${formatBytes(stats.memory.using)}/${formatBytes(stats.memory.total)}`} icon={faHardDrive} max={stats.memory.total} current={stats.memory.using} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Network usage (7 days)'} text={'0'} icon={faMemory} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'System Uptime'} text={convertMiliseconds(stats.uptime)} icon={faMemory} />
				</Col>
			</Row>
			<Row>
				<Col lg={4}>
					<div className="card shadow mb-4">
						<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							<h5 className="m-0 fw-bold">Database Backups</h5>
							<button className='btn btn-secondary' onClick={createDatabaseBackup}>Backup</button>
						</div>
						<div className="card-body table-responsive" style={{ overflowY: 'scroll', maxHeight: '40vh' }}>
							<Table>
								<Table.HeaderRow>
									<Table.Header>Name</Table.Header>
									<Table.Header>Size</Table.Header>
									<Table.Header className='text-center'>Status</Table.Header>
									<Table.Header className='text-center'>Info</Table.Header>
									<Table.Header className='text-center hide-on-mobile'>Actions</Table.Header>
								</Table.HeaderRow>
								<Table.Body>
									{backups.map(backup => (
										<tr key={backup.filename}>
											<td>{backup.filename}</td>
											<td>{formatBytes(backup.sizeBytes)}</td>
											<td className='text-center' style={{ color: backup.status == 'success' ? 'green' : 'red' }}>
												<FontAwesomeIcon size='lg' icon={backup.status == 'success' ? faCheck : faX} />
											</td>
											<td className='text-center'>
												<button className='btn' data-bs-toggle="modal" data-bs-target={`#${new Date(backup.createdAt).getTime()}`}>
													<FontAwesomeIcon size='lg' icon={faCircleInfo} />
												</button>
											</td>
											<td className='hide-on-mobile'>
												<div className='d-flex flex-row align-items-center justify-content-around'>
													<button className='btn' onClick={() => downloadBackup(backup.filename)}>
														<FontAwesomeIcon size='lg' icon={faDownload} />
													</button>
													<button className='btn' onClick={() => deleteBackup(backup.filename)}>
														<FontAwesomeIcon size='lg' icon={faTrash} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</Table.Body>
							</Table>
							{backups.map(backup => (<AdminBackupModel backup={backup} key={backup.filename} downloadBackup={() => downloadBackup(backup.filename)} deleteBackup={() => deleteBackup(backup.filename)} />))}
						</div>
					</div>
					&nbsp;
					<div className="card shadow mb-4">
						<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							<h5 className="m-0 fw-bold">Cache</h5>
						</div>
						<div className="card-body table-responsive">
							<Table>
								<Table.HeaderRow>
									<Table.Header>Name</Table.Header>
									<Table.Header>Size</Table.Header>
									<Table.Header>Max</Table.Header>
									<Table.Header>TTL</Table.Header>
									<Table.Header>Actions</Table.Header>
								</Table.HeaderRow>
								<Table.Body>
									<tr>
										<td>Files</td>
										<td>{cacheStats.files.size}</td>
										<td>{cacheStats.files.max}</td>
										<td>{convertMiliseconds(cacheStats.files.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('files')}>Reset</button></td>
									</tr>
									<tr>
										<td>Users</td>
										<td>{cacheStats.users.size}</td>
										<td>{cacheStats.users.max}</td>
										<td>{convertMiliseconds(cacheStats.users.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('users')}>Reset</button></td>
									</tr>
									<tr>
										<td>User History</td>
										<td>{cacheStats.userHistory.size}</td>
										<td>{cacheStats.userHistory.max}</td>
										<td>{convertMiliseconds(cacheStats.userHistory.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('history')}>Reset</button></td>
									</tr>
									<tr>
										<td>Sessions</td>
										<td>{cacheStats.sessions.size}</td>
										<td>{cacheStats.sessions.max}</td>
										<td>{convertMiliseconds(cacheStats.sessions.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('sessions')}>Reset</button></td>
									</tr>
									<tr>
										<td>Thumbnails</td>
										<td>{thumbnailCache.count} ({formatBytes(thumbnailCache.sizeInBytes)})</td>
										<td><FontAwesomeIcon icon={faInfinity} /></td>
										<td><FontAwesomeIcon icon={faInfinity} /></td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('thumbnails')}>Reset</button></td>
									</tr>
								</Table.Body>
							</Table>
						</div>
					</div>
				</Col>
				<Col lg={4}>
					{logContent.length == 0 ?
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h5 className="m-0 fw-bold">Log files</h5>
							</div>
							<div className="card-body table-responsive" style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
								<table className="table">
									<tbody>
										{logFileNames.map(name => (
											<tr key={logFileNames.indexOf(name)}>
												<th>
													<button className={`btn ${activeLog == name ? 'active' : ''}` } onClick={(e) => updateLogFileContent(e)}>{name}</button>
												</th>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
						:
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h4 className="m-0 fw-bold">Log content</h4>
								<div className="input-group mb-3" style={{ padding: 0, maxWidth: '50%' }}>
									<label className="input-group-text" htmlFor="inputGroupSelect01">Log type</label>
									<select className="form-select" id="inputGroupSelect01" aria-label="Default select example" onChange={(e) => updateViewContentType(e)}>
										<option selected value="ALL">All</option>
										<option value="DEBUG">Debug</option>
										<option value="INFO">Info</option>
										<option value="WARN">Warn</option>
										<option value="ERROR">Error</option>
										<option value="FATAL">Fatal</option>
									</select>
								</div>
							</div>
							<div className="card-body" style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
								<button className='btn btn-link' onClick={() => setLogContent([])} >Back</button>
								{logContent.map(line => (
									<div key={logContent.indexOf(line)}>{line}</div>
								))}
							</div>
						</div>
					}
				</Col>
				<Col lg={4}>
					<div className="card shadow mb-4">
						<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							<h4 className="m-0 fw-bold">CRON Jobs</h4>
						</div>
						<div className="card-body table-responsive">
							<Table>
								<Table.HeaderRow>
									<Table.Header>Name</Table.Header>
									<Table.Header className='text-center'>Latest Status</Table.Header>
									<Table.Header className='text-center'>Action</Table.Header>
									<Table.Header className='text-center'>Info</Table.Header>
								</Table.HeaderRow>
								<Table.Body>
									{cronJobs.map(job => (
										<tr key={job.name}>
											<td>{job.name}</td>
											<td className='text-center' style={{ color: job.latestStatus == null ? 'grey' : job.latestStatus == 'SUCCESS' ? 'green' : 'red' }}>
												<FontAwesomeIcon size='lg' icon={job.latestStatus == null ? faQuestion : job.latestStatus == 'SUCCESS' ? faCheck : faX } />
											</td>
											<td className='text-center'>
												<button className='btn btn-secondary btn-sm' onClick={() => runCronJob(job.name)}>
													Re-run
												</button>
											</td>
											<td className='text-center'>
												<button className='btn' data-bs-toggle="modal" data-bs-target={`#${job.name}`}>
													<FontAwesomeIcon size='lg' icon={faCircleInfo} />
												</button>
											</td>
										</tr>
									))}
								</Table.Body>
							</Table>
							{cronJobs.map((job) => <AdminCRONJobLogsModal CRONJob={job} key={job.name} />)}
						</div>
					</div>
				</Col>
			</Row>
		</AdminLayout>
	);
}

// Fetch endpoints
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	try {
		const [{ data }, { data: { backups } }, { data: { folderSize } }, { data: stats }, { data: cacheStats }, { data: { cronJobs } }] = await Promise.all([
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/logs`, {
				headers: { cookie: ctx.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/database/backups`, {
				headers: { cookie: ctx.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/cache/thumbnails`, {
				headers: { cookie: ctx.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/stats`, {
				headers: { cookie: ctx.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/cache/stats`, {
				headers: { cookie: ctx.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/cron-jobs`, {
				headers: { cookie: ctx.req.headers.cookie },
			}),
		]);

		// Add the frontend RAM usage to total
		stats.memory.using = stats.memory.using + process.memoryUsage().heapUsed;
		return { props: { logFiles: data.logs, totalLogSize: data.totalLogSize, backups, thumbnailCache: folderSize, stats, cacheStats, cronJobs } };
	} catch {
		return { props: { logFiles: [], totalLogSize:0, backups: [], thumbnailCache: {}, stats: { memory: {} }, cacheStats: {}, cronJobs:[], error: 'API server currently unavailable' } };
	}
}
