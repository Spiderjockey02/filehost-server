import { faFolderTree, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Row, Col, InfoPill, FileUploadLineChart } from '@/components';
import type { AdminStorageIdPageProps } from '@/types/pages';
import { useToast } from '@/components/Hooks/ToastManager';
import { AdminManageUsersCard } from '@/components/Cards';
import type { GetServerSidePropsContext } from 'next';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import type { Session } from '@/auth/server';
import { authClient } from '@/auth/client';
import { notFound } from 'next/navigation';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminStorageIdPage({ storageId }: AdminStorageIdPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, error, isLoading } = useQuery({
		queryKey: [`storage_${storageId}`],
		queryFn: async ({ signal }) => API.ADMIN.fetchStorageById(signal, storageId),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	const storage = data?.storage;
	return (
		<AdminLayout activeTab="storage" user={session.user as Session['user']} tabName={`Storage Id: ${storage?.name}`}>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Storage: {storage?.name}</h1>
			</div>
			<Row>
				<Col lg={6} className='mb-4'>
					<InfoPill title="Total files" text={storage?._count.files ?? 0} icon={faFolderTree} isLoading={isLoading} />
				</Col>
				<Col lg={6} className='mb-4'>
					<InfoPill title="Total users" text={storage?._count.users ?? 0} icon={faUsers} isLoading={isLoading} />
				</Col>
			</Row>
			<FileUploadLineChart storageId={storage?.id} />
			<AdminManageUsersCard storageId={storage?.id} />
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
		const storageId = context.params?.id;
		if (typeof storageId !== 'string') return notFound();
		return { props: { storageId: storageId } };
	}
}