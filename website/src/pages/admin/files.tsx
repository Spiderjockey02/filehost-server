import { Row, Col, InfoPill, BarChart, Card, ObjectOrientedPieChart, FileUploadLineChart } from '@/components';
import { faFolderTree, faHardDrive, faMemory, faTrash, faUsers } from '@fortawesome/free-solid-svg-icons';
import MimeTypePieChart from '@/components/Graphs/MimeTypePieChart';
import { formatBytes, queryOptions } from '@/utils/functions';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { useQuery } from '@tanstack/react-query';
import type { PageProps } from '@/types/pages';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminFilesPage({ user }: PageProps) {
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminFiles'],
		queryFn: async ({ signal }) => Promise.all([
			API.ADMIN.fetchFileStats(signal),
			API.ADMIN.fetchFileSizeCategories(signal),
			API.ADMIN.fetchFileUploadGrowth(signal, new URLSearchParams('interval=daily')),
		]),
		...queryOptions,
	});

	const fileCategory = {
		labels: Object.keys(data?.[1].categories ?? {}),
		datasets: [
			{
				label: 'Files uploaded',
				data: Object.values(data?.[1].categories ?? {}),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	return (
		<AdminLayout user={user} activeTab='files' tabName='Admin File'>
			&nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">File Dashboard</h1>
			</div>
			<Row>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Total files" text={`${(data?.[0].files ?? 0) + (data?.[0].folders ?? 0)}`} icon={faUsers} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="New files (7 days)" text={`${data?.[0].newFiles}`} icon={faFolderTree} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Total Storage Used" text={formatBytes(data?.[0].totalStorageSize)} icon={faHardDrive} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Average File Size" text={formatBytes(data?.[0].avgFileSize)} icon={faHardDrive} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Most Common File Type" text={Object.keys(data?.[0].mostCommonFileTypes ?? {})[0]} icon={faMemory} isLoading={isLoading} />
				</Col>
				<Col xxl={2} xl={4} lg={4} md={6} className='mb-4'>
					<InfoPill title="Deleted Files Count" text={`${data?.[0].deletedFiles}`} icon={faTrash} isLoading={isLoading} />
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
							<ObjectOrientedPieChart data={{ files: data?.[0].files ?? 0, folders: data?.[0].folders ?? 0 }} />
						</Card.Body>
					</Card>
				</Col>
				<Col xxl={4} xl={4} lg={12} md={12} className='mb-4'>
					<MimeTypePieChart mimeType={data?.[0].mostCommonFileTypes ?? {}} />
				</Col>
			</Row>
			<p>Some graphs about deleted files, what no clue?</p>
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
		return { props: { user: data.user } };
	}
}