import { AdminCreateListenerModal, AdminEditListenerModal } from '@/components/Modals';
import { generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { faAdd, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Table, Card } from '@/components';
import { useState } from 'react';
import API from '@/services/api';
import Link from 'next/link';

export default function AdminManageLogListenersCard() {
	const [activeModal, setActiveModal] = useState<string | null>(null);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['auditLogs'],
		queryFn: async ({ signal }) => API.ADMIN.LOGS.fetchListeners(signal),
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>
        Audit Log Listeners
				<button className='btn btn-success' onClick={() => setActiveModal('createNewListener')}>
					<FontAwesomeIcon icon={faAdd} />
					Listener
				</button>
			</Card.Header>
			<Card.Body className='table-responsive'>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header>User Id</Table.Header>
						<Table.Header>Type</Table.Header>
						<Table.Header className='text-center'>Enabled</Table.Header>
						<Table.Header>Events</Table.Header>
						<Table.Header className='text-center'>Edit</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || data == null ?
								generatePlaceholderTable(8, 6)
								: data?.listeners.map((listener, index) => (
									<tr key={index}>
										<td>{listener.name}</td>
										<td><Link href={`/admin/users/${listener.adminId}`}>{listener.adminId}</Link></td>
										<td>{listener.type}</td>
										<td className='text-center'>{listener.enabled ? 'Yes' : 'No'}</td>
										<td>{listener.events.map(s => s.eventId.split('_').join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())).join(', ')}</td>
										<td className='text-center'>
											<button className='btn' onClick={() => setActiveModal(listener.id)}>
												<FontAwesomeIcon size='lg' icon={faPenToSquare} />
											</button>
										</td>
									</tr>
								))
							:
							<tr>
								<td colSpan={6} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to fetch audit log listeners'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				{(activeModal && activeModal !== 'createNewListener' && data) && <AdminEditListenerModal show={true} listener={data.listeners.find((a) => a.id === activeModal)!} onClose={() => setActiveModal(null)} refetch={refetch} />}
				<AdminCreateListenerModal show={activeModal == 'createNewListener'} onClose={() => setActiveModal(null)} />
			</Card.Body>
		</Card>
	);
}