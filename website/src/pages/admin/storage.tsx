import { authClient } from '@/auth/client';
import { Card, Col, ErrorPopup, InfoPill, Row, Table } from '@/components';
import { ObjectOrientedPieChart } from '@/components/Graphs/ObjectOrientedPieChart';
import { AdminCreateNewMediumModal } from '@/components/Modals/AdminCreateNewMediumModal';
import AdminLayout from '@/layouts/admin';
import { formatBytes, headers } from '@/utils/functions';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StorageMedium } from '@prisma/client';
import axios from 'axios';
import { User } from 'better-auth';
import { GetServerSidePropsContext } from 'next/types';

interface Props {
  error: string
	storages: StorageMedium[]
	MediumCounts: {
		[key: string]: number
	}
}

export default function AdminStorage({ error, storages, MediumCounts }: Props) {
	const { data: session } = authClient.useSession();
	if (session == null) return null;


	const thumbnailMedium = storages.find(s => s.thumbnailOnly);
	const avatarMedium = storages.find(s => s.avatarOnly);

	return (
		<AdminLayout activeTab='storage' user={session.user as User} tabName='Admin System'>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Storage Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			{error && <ErrorPopup text={error} />}
			<Row>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title={'Avatar Storage'} text={formatBytes(avatarMedium?.usedSize)} icon={faDownload} />
				</Col>
				<Col xl={3} md={6} className='mb-4'>
					<InfoPill title={'Thumbnail Storage'} text={formatBytes(thumbnailMedium?.usedSize)} icon={faDownload} />
				</Col>
			</Row>
			<Row>
				<Col xl={6} md={6} className='mb-4'>
					<Card>
						<Card.Header>
							Storage Medium Types
						</Card.Header>
						<Card.Body>
							<ObjectOrientedPieChart data={MediumCounts} />
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Card>
				<Card.Header>
					Storages Table
				</Card.Header>
				<Card.Body className='table-responsive'>
					<Table>
						<Table.HeaderRow>
							<Table.Header>Name</Table.Header>
							<Table.Header>Type</Table.Header>
							<Table.Header>Utilisation</Table.Header>
							<Table.Header>Attribute</Table.Header>
							<Table.Header>Created at</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{storages.map((u) => (
								<tr key={u.id}>
									<td scope="row">{u.name}</td>
									<td>{u.type}</td>
									<td>{formatBytes(u.usedSize)} / {formatBytes(u.maxSize)}</td>
									<td>{getAttribute(u)}</td>
									<td>{new Date(u.createdAt).toLocaleDateString()}</td>
								</tr>
							))
							}
						</Table.Body>
					</Table>
					<button className='btn btn-success' data-bs-toggle="modal" data-bs-target="#AdminCreateNewMediumModal">Create new Medium</button>
					<AdminCreateNewMediumModal />
				</Card.Body>
			</Card>
		</AdminLayout>
	);
}

function getAttribute(storage: StorageMedium) {
	if (storage.isPrivate) return 'Private access only.';
	if (storage.thumbnailOnly) return 'Thumbnail use only.';
	if (storage.avatarOnly) return 'Avatar use only.';
	return 'Public use.';
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

			return { props: { storages: storageData.storages, MediumCounts } };
		} catch (err) {
			console.log(err);
			return { props: { storages: [], MediumCounts: {}, error: 'API server currently unavailable' } };
		}
	}
}