import { authClient } from '@/auth/client';
import { Row, Col, InfoPill, FileUploadLineChart } from '@/components';
import AdminUserTableCards from '@/components/Cards/AdminUserTable';
import AdminLayout from '@/layouts/admin';
import { StorageWithCounts } from '@/types/database';
import { headers } from '@/utils/functions';
import { faDownload, faFolderTree, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { User } from 'better-auth';
import { GetServerSidePropsContext } from 'next';

interface Props {
	storage: StorageWithCounts
}

export default function AdminStorageIdPage({ storage }: Props) {
	const { data: session } = authClient.useSession();
	if (session == null) return null;

	return (
		<AdminLayout activeTab="storage" user={session.user as User} tabName={`Storage Id: ${storage.name}`}>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Storage: {storage.name}</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col lg={6} className='mb-4'>
					<InfoPill title="Total files" text={storage._count.files} icon={faFolderTree} />
				</Col>
				<Col lg={6} className='mb-4'>
					<InfoPill title="Total users" text={storage._count.users} icon={faUsers} />
				</Col>
			</Row>
			<FileUploadLineChart storageId={storage.id} />
			<AdminUserTableCards storageId={storage.id} />
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
		const storageId = context.params?.id;
		try {
			const { data: { storage } } = await axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/storage/${storageId}`, headers(context.req));
			return { props: { storage } };
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