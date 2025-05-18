import { faDownload, faUsers, faHardDrive, faFolderTree } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Table, InfoPill, LineChart } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { GetServerSidePropsContext } from 'next';
import type { AdminPageProps } from '@/types/pages';
import { formatBytes } from '@/utils/functions';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import axios from 'axios';
import { fileItem } from '@/types';
import { useEffect, useState } from 'react';
import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';
import Link from 'next/link';
import { File } from '@prisma/client';
import { User } from 'better-auth';
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

type growthGraphType = 'daily' | 'monthly' | 'yearly'

export default function Files({ stats, rawUserGrowth, rawUploadGrowth }: AdminPageProps) {
	const { data: session } = authClient.useSession();
	const [recentFiles, setRecentFiles] = useState<File[]>([]);
	const [userGrowth, setUserGrowth] = useState(rawUserGrowth);
	const [userGrowthFrame, setUserGrowthFrame] = useState<growthGraphType>('monthly');
	const [uploadGrowth, setUploadGrowth] = useState(rawUploadGrowth);
	const [uploadGrowthFrame, setUploadGrowthFrame] = useState<growthGraphType>('daily');
	const [page, setPage] = useState(0);

	const userJoinData = {
		labels: Object.keys(userGrowth),
		datasets: [
			{
				label: 'User count',
				data: Object.values(userGrowth),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

	const fileUploadData = {
		labels: Object.keys(uploadGrowth),
		datasets: [
			{
				label: 'Total files',
				data: Object.values(uploadGrowth),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

	async function updatedUserJoinGrowth(time: 'daily' | 'monthly' | 'yearly') {
		try {
			const { data: p } = await axios.get(`/api/admin/users/growth?frame=${time}`);
			const keys = Object.keys(p);
			setUserGrowth(p[keys[0]]);
			setUserGrowthFrame(time);
		} catch (error) {
			console.log(error);
		}
	}

	async function updatedUploadGrowth(time: 'daily' | 'monthly' | 'yearly') {
		try {
			const { data: p } = await axios.get(`/api/admin/files/growth?frame=${time}`);
			const keys = Object.keys(p);
			setUploadGrowth(p[keys[0]]);
			setUploadGrowthFrame(time);
		} catch (error) {
			console.log(error);
		}
	}

	useEffect(() => {
		// Fetch recent files
		(async () => {
			try {
				const { data: { files } } = await axios.get(`/api/admin/files/recently-uploaded?page=${page}`);
				setRecentFiles(files);
			} catch (err) {
				console.error(err);
			}
		})();
	}, [page]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab='dashboard' user={session.user as User} tabName='Admin Dashboard'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Admin Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title={'Total Users (Active)'} text={`${stats.users.total} (${stats.users.active})`} icon={faUsers} />
				</Col>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title={'Total files'} text={stats.storage.totalFiles} icon={faFolderTree} />
				</Col>
				<Col xl={4} md={6} className='mb-4'>
					<InfoPill title={'System Health'} text={'True'} icon={faHardDrive} />
				</Col>
			</Row>
			<Row>
				<Col lg={6}>
					<div className="card mb-4">
						<h5 className="card-header d-flex flex-row align-items-center justify-content-between">
							User Growth Over Time
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
									{userGrowthFrame}
								</button>
								<ul className="dropdown-menu dropdown-menu-end">
									<li><a className="dropdown-item" href="#" onClick={() => updatedUserJoinGrowth('daily')}>Daily</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedUserJoinGrowth('monthly')}>Monthly</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedUserJoinGrowth('yearly')}>Yearly</a></li>
								</ul>
							</div>
						</h5>
						<div className="card-body">
							<LineChart data={userJoinData} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</div>
					</div>
				</Col>
				<Col lg={6}>
					<div className="card mb-4">
						<h5 className="card-header d-flex flex-row align-items-center justify-content-between">
							File Uploads Over Time
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
									{uploadGrowthFrame}
								</button>
								<ul className="dropdown-menu dropdown-menu-end">
									<li><a className="dropdown-item" href="#" onClick={() => updatedUploadGrowth('daily')}>Daily</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedUploadGrowth('monthly')}>Monthly</a></li>
									<li><a className="dropdown-item" href="#" onClick={() => updatedUploadGrowth('yearly')}>Yearly</a></li>
								</ul>
							</div>
						</h5>
						<div className="card-body">
							<LineChart data={fileUploadData} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</div>
					</div>
				</Col>
			</Row>
			<Row>
				<Col xl={8} md={12} className='mb-4'>
					<div className="card">
						<h5 className="card-header">Recent Uploads</h5>
						<div className="card-body table-responsive">
							<Table>
								<Table.HeaderRow>
									<Table.Header>File Id</Table.Header>
									<Table.Header>MIME Type</Table.Header>
									<Table.Header>Size</Table.Header>
									<Table.Header>Date</Table.Header>
									<Table.Header>User</Table.Header>
								</Table.HeaderRow>
								<Table.Body>
									{recentFiles.map(file => (
										<tr key={file.id}>
											<td>{file.id}</td>
											<td className='text-truncate' style={{ maxWidth: '300px' }}><Link href={`https://mimetype.io/${file.mimetype}`} target="_blank">{file.mimetype}</Link></td>
											<td>{formatBytes(file.size)}</td>
											<td>{timeAgo.format(new Date().getTime() - (new Date().getTime() - new Date(file.createdAt).getTime()))}</td>
											<td><Link href={`/admin/users/${file.userId}`}>{file.userId}</Link></td>
										</tr>
									))}
								</Table.Body>
							</Table>
							<div className="d-flex flex-row justify-content-between">
								<div></div>
								<nav aria-label="Page navigation">
									<ul className="pagination">
										<li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
											<button className="page-link" onClick={() => setPage(Math.max(page - 1, 0))} aria-label="Previous">
												<span aria-hidden="true">&laquo;</span>
											</button>
										</li>
										<li className="page-item disabled">
											<span className="page-link">{page} / {Math.floor(stats.storage.totalFiles / 20)}</span>
										</li>
										<li className={`page-item ${page == Math.floor(stats.storage.totalFiles / 20) ? 'disabled' : ''}`}>
											<button className="page-link" onClick={() => setPage(Math.min(page + 1, 20))} aria-label="Next">
												<span aria-hidden="true">&raquo;</span>
											</button>
										</li>
									</ul>
								</nav>
								<div className="d-flex align-items-center mb-2">
									<p className="mb-0 me-2">
										Showing {page * 20} to {Math.min((page + 1) * 20, stats.storage.totalFiles)} out of {stats.storage.totalFiles}
									</p>
								</div>
							</div>
						</div>
					</div>
				</Col>
			</Row>
		</AdminLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Validate path
	try {
		const [{ data: stats }, { data: { months } }, { data: { days } }] = await Promise.all([
			 axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/stats`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/users/growth?frame=monthly`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/files/growth?frame=daily`, {
				headers: { cookie: context.req.headers.cookie },
			}),
		]);
		return { props: { stats, rawUserGrowth: months, rawUploadGrowth: days } };
	} catch (err) {
		console.error(err);
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	}
}
