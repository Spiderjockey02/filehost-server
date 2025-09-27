import { faDownload, faFolderTree, faHardDrive, faMemory, faTrash, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Row, Col, InfoPill, BarChart, Card, ErrorPopup, ObjectOrientedPieChart, FileUploadLineChart } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatBytes, headers } from '@/utils/functions';
import { AdminFilesPageProps } from '@/types/pages';
import { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { User } from 'better-auth';
import axios from 'axios';

export default function AdminFilesPage(data: AdminFilesPageProps) {
	const { data: session } = authClient.useSession();

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

	if (session == null) return null;
	return (
		<AdminLayout activeTab='files' user={session.user as User} tabName='Admin File'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">File Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			{data.error && <ErrorPopup text={data.error} />}
			<Row>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Total files" text={data.files + data.folders} icon={faUsers} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="New files (7 days)" text={data.newFiles} icon={faFolderTree} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Total Storage Used" text={formatBytes(data.totalStorageSize)} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Average File Size" text={formatBytes(data.avgFileSize)} icon={faHardDrive} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Most Common File Type" text={Object.keys(data.mostCommonFileTypes)[0]} icon={faMemory} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Deleted Files Count" text={data.deletedFiles} icon={faTrash} />
				</Col>
			</Row>
			<FileUploadLineChart />
			<Row>
				<Col xxl={4} xl={4} lg={12} md={12} className='mb-4'>
					<Card>
						<Card.Header>
							File Size Distribution
						</Card.Header>
						<Card.Body>
							<BarChart data={fileCategory} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
						</Card.Body>
					</Card>
				</Col>
				<Col xxl={4} xl={4} lg={12} md={12} className='mb-4'>
					<Card>
						<Card.Header>
							System Content: Files vs Folders
						</Card.Header>
						<Card.Body>
							<ObjectOrientedPieChart data={{ files: data.files, folders: data.folders }} />
						</Card.Body>
					</Card>
				</Col>
				<Col xxl={4} xl={4} lg={12} md={12} className='mb-4'>
					<Card>
						<Card.Header>
							File MIME Type Distribution
						</Card.Header>
						<Card.Body className='d-flex justify-content-center'>
							<ObjectOrientedPieChart data={data.mostCommonFileTypes} />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<p>Some graphs about deleted files, what no clue?</p>
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
			const [{ data: apiData }, { data: { categories } }, { data: { days } }] = await Promise.all([
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/files`, headers(context.req)),
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/files/sized-categories`, headers(context.req)),
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/files/growth?frame=daily`, headers(context.req)),
			]);
			return { props: { ...apiData, categories, rawUploadGrowth: days } };
		} catch (err) {
			console.error(err);
			return {
				props: {
					files: 0,
					folders: 0,
					avgFileSize: 0,
					deletedFiles: 0,
					newFiles: 0,
					totalStorageSize: 0,
					mostCommonFileTypes: [],
					days: {},
					categories: {},
					rawUploadGrowth: {},
					error: 'API server currently unavailable',
				},
			};
		}
	}
}