import { authClient } from '@/auth/client';
import { Row, Col, InfoPill, BarChart, LineChart } from '@/components';
import { ObjectOrientedPieChart } from '@/components/Graphs/ObjectOrientedPieChart';
import AdminLayout from '@/layouts/admin';
import { formatBytes } from '@/utils/functions';
import { faDownload, faFolderTree, faHardDrive, faMemory, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { GetServerSidePropsContext } from 'next';
import { useEffect, useState } from 'react';

interface MimeType {
	mimeType: string
	count: number
}

interface Props {
	files: number
	folders: number
	avgFileSize: number
	mostCommonFileTypes: MimeType[]
	days: {
		[key: string]: number
	}
	categories: {
		[key: string]: number
	}
	rawUploadGrowth: {
    [key: string]: number
  }
}

interface MimeTypeObject {
	[key: string]: number;
}

type growthGraphType = 'daily' | 'monthly' | 'yearly'

export default function AdminFiles(data: Props) {
	const { data: session } = authClient.useSession();
	const [mimeType, setMimeType] = useState<MimeTypeObject>({});
	const [uploadGrowth, setUploadGrowth] = useState(data.rawUploadGrowth);
	const [uploadGrowthFrame, setUploadGrowthFrame] = useState<growthGraphType>('daily');

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

	const fileCategory = {
		labels: Object.keys(data.categories),
		datasets: [
			{
				label: 'Files uploaded',
				data: Object.values(data.categories),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

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
				const { data: { mimeTypes } } = await axios.get('/api/admin/mimetypes?grouped=true');
				setMimeType(mimeTypes);
			} catch (err) {
				console.error(err);
			}
		})();
	}, []);
	if (session == null) return null;
	return (
		<AdminLayout activeTab='files' user={session.user} tabName='Admin File'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">File Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Total files'} text={data.files + data.folders} icon={faUsers} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'New files (7 days)'} text="0" icon={faFolderTree} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Total Storage Used'} text={'0'} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Average File Size'} text={formatBytes(data.avgFileSize)} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Most Common File Type'} text={data.mostCommonFileTypes[0].mimeType} icon={faMemory} />
				</Col>
				<Col xxl={2} xl={3} lg={4} md={6} className='mb-4'>
					<InfoPill title={'Deleted Files Count'} text={'0'} icon={faMemory} />
				</Col>
			</Row>
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
			<Row>
				<Col xxl={4} xl={4} lg={12} md={12} className='mb-4'>
					<div className="card mb-4">
						<h5 className="card-header">File Size Distribution</h5>
						<div className="card-body">
							<BarChart data={fileCategory} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</div>
					</div>
				</Col>
				<Col xxl={4} xl={4} lg={12} md={12} className='mb-4'>
					<div className="card mb-4">
						<h5 className="card-header">Suspicious MIME Type Upload</h5>
						<div className="card-body">
							<p>Make hard ban list and a soft ban list (suspicious)</p>
						</div>
					</div>
				</Col>
				<Col xxl={4} xl={4} lg={12} md={12} className='mb-4'>
					<div className="card">
						<h5 className="card-header">File MIME types</h5>
						<div className="card-body">
							<ObjectOrientedPieChart data={mimeType} />
						</div>
					</div>
				</Col>
			</Row>
			<p>Some graphs about deleted files, what no clue?</p>
		</AdminLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Validate path
	try {
		const [{ data }, { data: { categories } }, { data: { days } }] = await Promise.all([
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/files`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/files/sized-categories`, {
				headers: { cookie: context.req.headers.cookie },
			}),
			axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/files/growth?frame=daily`, {
				headers: { cookie: context.req.headers.cookie },
			}),
		]);
		return { props: { ...data, categories, rawUploadGrowth: days } };
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
