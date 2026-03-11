import { faDownload, faFile, faFileImage, faHardDrive } from '@fortawesome/free-solid-svg-icons';
import { Card, Col, InfoPill, Row, ObjectOrientedPieChart } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatBytes, queryOptions } from '@/utils/functions';
import { AdminManageStorageCard } from '@/components/Cards';
import { useToast } from '@/components/Hooks/ToastManager';
import { GetServerSidePropsContext } from 'next/types';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/auth/server';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { useEffect } from 'react';
import API from '@/services/api';

export default function AdminStoragePage() {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminStorage'],
		queryFn: async ({ signal }) => Promise.all([
			API.ADMIN.fetchStorages(signal),
			API.ADMIN.fetchStorageTypes(signal),
		]),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	const avatarMedium = data?.[0].storages.find(s => s.avatarOnly);
	if (session == null) return null;
	return (
		<AdminLayout activeTab='storage' user={session.user as Session['user']} tabName='Admin Storage'>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Storage Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Avatar Storage" text={formatBytes(avatarMedium?.usedSize)} icon={faFileImage} isLoading={isLoading} />
				</Col>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Average file count" text={`${data?.[0].avgFileCount}`} icon={faFile} isLoading={isLoading} />
				</Col>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Average usage" text={formatBytes(data?.[0].avgStorageUsage)} icon={faHardDrive} isLoading={isLoading} />
				</Col>
			</Row>
			<Row>
				<Col xl={6} md={6} className='mb-4'>
					<Card>
						<Card.Header>
							Storage Medium Types
						</Card.Header>
						<Card.Body>
							{error ?
								<div className="alert alert-danger" role="alert">
									{error.message}
								</div>
								: <ObjectOrientedPieChart data={data?.[1].MediumCounts ?? {}} />
							}
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<AdminManageStorageCard />
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
		return { props: {} };
	}
}