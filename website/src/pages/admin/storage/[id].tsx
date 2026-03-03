import { faFolderTree, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Row, Col, InfoPill, FileUploadLineChart } from '@/components';
import type { AdminStorageIdPageProps } from '@/types/pages';
import { useToast } from '@/components/Hooks/ToastManager';
import { AdminManageUsersCard } from '@/components/Cards';
import type { GetServerSidePropsContext } from 'next';
import { headers } from '@/utils/functions';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import type { User } from 'better-auth';
import { useEffect } from 'react';
import axios from 'axios';
import API from '@/services/api';

export default function AdminStorageIdPage({ storage, error }: AdminStorageIdPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	useEffect(() => {
		if (error) showToast('error', error);
	}, [error]);

	if (session == null) return null;
	return (
		<AdminLayout activeTab="storage" user={session.user as User} tabName={`Storage Id: ${storage?.name}`}>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Storage: {storage?.name}</h1>
			</div>
			<Row>
				<Col lg={6} className='mb-4'>
					<InfoPill title="Total files" text={storage?._count.files ?? 0} icon={faFolderTree} />
				</Col>
				<Col lg={6} className='mb-4'>
					<InfoPill title="Total users" text={storage?._count.users ?? 0} icon={faUsers} />
				</Col>
			</Row>
			<FileUploadLineChart storageId={storage?.id} />
			<AdminManageUsersCard storageId={storage?.id} />
		</AdminLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const data = await API.SESSION.fetchCurrentSession(context.req.headers.cookie || '');
	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	}

	if (data.user.role !== 'admin') {
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
			return { props: { storage: null, error: 'API server currently unavailable' },
			};
		}
	}
}