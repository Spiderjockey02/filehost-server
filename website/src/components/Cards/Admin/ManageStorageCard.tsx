import { formatBytes, generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { AdminCreateMediumModal, AdminEditMediumModal } from '@/components/Modals';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faPen } from '@fortawesome/free-solid-svg-icons';
import type { StorageWithCounts } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';
import { useState } from 'react';
import API from '@/services/api';
import Link from 'next/link';

export default function AdminManageStorageCard() {
	const [activeModal, setActiveModal] = useState<string | null>(null);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['storages'],
		queryFn: async ({ signal }) => API.ADMIN.fetchStorages(signal),
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>
        Storages Table
				<button className='btn btn-success' onClick={() => setActiveModal('create')}>
					<FontAwesomeIcon icon={faAdd} /> Medium
				</button>
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
							isLoading || data == null ?
								generatePlaceholderTable(8, 7)
								 : data.storages.map((s) => (
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
											<button className='btn' onClick={() => setActiveModal(s.id)} style={{ padding: '0' }}>
												<FontAwesomeIcon size='lg' icon={faPen} />
											</button>
										</td>

									</tr>
								))
							:
							<tr>
								<td colSpan={5} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to load storage mediums'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				{activeModal == 'create' && <AdminCreateMediumModal refreshTable={refetch} show={true} onClose={() => setActiveModal(null)} />}
				{(data && activeModal !== null && activeModal !== 'create')
					&& <AdminEditMediumModal storage={data.storages.find(s => s.id == activeModal)!} refreshTable={refetch} show={true} onClose={() => setActiveModal(null)} />
				}
			</Card.Body>
		</Card>
	);
}

function getAttribute(storage: StorageWithCounts) {
	if (storage.isPrivate) return 'Private access only.';
	if (storage.avatarOnly) return 'Avatar use only.';
	return 'Public use.';
}