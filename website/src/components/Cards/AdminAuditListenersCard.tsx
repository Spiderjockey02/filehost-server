import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import Card from '../UI/Card';
import Table from '../UI/Table';
import { AdminCreateNewListenerModal } from '../Modals/AdminCreateNewListenerModal';
import { FullAuditLogListener } from '@/types/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import AdminEditListenerModal from '../Modals/AdminEditListenerModal';

export default function AdminAuditListenersCard() {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['recentActivity'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/admin/logs/listeners', { signal });
			if (!res.ok) throw new Error(`Failed to fetch audit log listeners: ${res.statusText}`);

			const d = await res.json();
			return d as { listeners: FullAuditLogListener[] };
		},
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>
        Audit Log Listeners
				<button className='btn btn-success' data-bs-toggle="modal" data-bs-target="#AdminCreateNewListenerModal">
					<FontAwesomeIcon icon={faAdd} />
					Add Listener
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
								(
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
									data?.listeners.map((activity, index) => (
										<tr key={index}>
											<td>{activity.name}</td>
											<td><Link href={`/admin/users/${activity.adminId}`}>{activity.adminId}</Link></td>
											<td>{activity.type}</td>
											<td className='text-center'>{activity.enabled ? 'Yes' : 'No'}</td>
											<td>{activity.events.map(s => s.eventId.split('_').join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())).join(', ')}</td>
											<td className='text-center'>
												<button className='btn' data-bs-toggle="modal" data-bs-target={`#${activity.id}`}>
													<FontAwesomeIcon size='lg' icon={faPenToSquare} />
												</button>
											</td>
										</tr>
									))
								) :
							<tr>
								<td colSpan={5} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to fetch audit log listeners'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				{data?.listeners.map(listener => (<AdminEditListenerModal key={listener.id} listener={listener} refetch={refetch} />))}
				<AdminCreateNewListenerModal />
			</Card.Body>
		</Card>
	);
}