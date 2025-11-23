import { faDownload, faFile, faFileImage, faHardDrive } from '@fortawesome/free-solid-svg-icons';
import { Card, Col, InfoPill, Row, ObjectOrientedPieChart } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminManageStorageCard } from '@/components/Cards';
import { useToast } from '@/components/Hooks/ToastManager';
import type { AdminStoragePageProps } from '@/types/pages';
import { formatBytes, headers } from '@/utils/functions';
import { GetServerSidePropsContext } from 'next/types';
import { authClient } from '@/auth/client';
import AdminLayout from '@/layouts/admin';
import { User } from 'better-auth';
import { useEffect } from 'react';
import axios from 'axios';

export default function AdminStoragePage({ error, storages, MediumCounts, avgFileCount, avgStorageUsage }: AdminStoragePageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	useEffect(() => {
		if (error) showToast('error', error);
	}, [error]);

	const avatarMedium = storages.find(s => s.avatarOnly);
	if (session == null) return null;
	return (
		<AdminLayout activeTab='storage' user={session.user as User} tabName='Admin Storage'>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Storage Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Avatar Storage" text={formatBytes(avatarMedium?.usedSize)} icon={faFileImage} />
				</Col>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Average file count" text={`${avgFileCount}`} icon={faFile} />
				</Col>
				<Col xl={4} md={6} className="mb-4">
					<InfoPill title="Average usage" text={formatBytes(avgStorageUsage)} icon={faHardDrive} />
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
									{error}
								</div>
								: <ObjectOrientedPieChart data={MediumCounts} />
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
			const [{ data: storageData }, { data: { MediumCounts } }] = await Promise.all([
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/storage`, headers(context.req)),
				axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/storage/types`, headers(context.req)),
			]);

			return { props: { storages: storageData.storages, avgFileCount: storageData.avgFileCount, avgStorageUsage: storageData.avgStorageUsage, MediumCounts } };
		} catch (err) {
			console.log(err);
			return { props: { storages: [], avgFileCount: 0, avgStorageUsage: 0, MediumCounts: {}, error: 'API server currently unavailable' } };
		}
	}
}