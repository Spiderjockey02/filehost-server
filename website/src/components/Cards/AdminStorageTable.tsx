import { formatBytes, queryOptions } from '@/utils/functions';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminCreateNewMediumModal } from '../Modals/AdminCreateNewMediumModal';
import { AdminStorageManagementModal } from '../Modals/AdminStorageManagementModal';
import Card from '../UI/Card';
import Table from '../UI/Table';
import { StorageWithCounts } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function AdminStorageTable() {
  	const { data, isLoading, error } = useQuery({
		queryKey: ['storages'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/admin/storage', { signal });
			if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);

			const d = await res.json();
			return d as { storages: StorageWithCounts[] };
		},
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>
        Storages Table
				<button className='btn btn-success' data-bs-toggle="modal" data-bs-target="#AdminCreateNewMediumModal">Create new Medium</button>
			</Card.Header>
			<Card.Body className='table-responsive'>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header>Type</Table.Header>
						<Table.Header>Utilisation</Table.Header>
						<Table.Header>Attribute</Table.Header>
						<Table.Header>Created at</Table.Header>
						<Table.Header className='text-center'>Edit</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || data == null ? (
								[0, 0, 0, 0, 0, 0, 0, 0].map((_, index) => (
									<tr key={index}>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
									</tr>
								))
							) : (
								data.storages.map((s) => (
									<tr key={s.id}>
										<td scope="row">
											<Link href={`/admin/storage/${s.id}`}>
												{s.name}
											</Link>
										</td>
										<td>{s.type}</td>
										<td>{formatBytes(s.usedSize)} / {formatBytes(s.maxSize)}</td>
										<td>{getAttribute(s)}</td>
										<td>{new Date(s.createdAt).toLocaleDateString()}</td>
										<td className='text-center'>
											<button className='btn' data-bs-toggle="modal" data-bs-target={`#storageMigrateModal_${s.id}`} style={{ padding: '0' }}>
												<FontAwesomeIcon size='lg' icon={faPen} />
											</button>
										</td>

									</tr>
								))
							) :
							<tr>
								<td colSpan={5} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to load users'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				<AdminCreateNewMediumModal />
				{data?.storages.map(s => (<AdminStorageManagementModal storage={s} key={s.id} />))}
			</Card.Body>
		</Card>
	);
}

function getAttribute(storage: StorageWithCounts) {
	if (storage.isPrivate) return 'Private access only.';
	if (storage.avatarOnly) return 'Avatar use only.';
	return 'Public use.';
}