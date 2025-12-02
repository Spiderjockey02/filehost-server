import type { AdminManageUserNotficationsCardProps } from '@/types/Components/Card';
import { format, generatePlaceholderTable } from '@/utils/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminSendNotificationModal } from '@/components/Modals';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { Notification } from '@/types/generated/browser';
import { faAdd } from '@fortawesome/free-solid-svg-icons';
import { Card, Table } from '@/components';
import { useState } from 'react';

export default function AdminManageUserNotficationsCard({ userId }: AdminManageUserNotficationsCardProps) {
	const [showModal, setShowModal] = useState(false);
	const [page, setPage] = useState(0);

	const { data, isLoading, error } = useQuery({
		queryKey: ['userNotifications', userId, page],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/users/${userId}/notifications?page=${page}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch user's notifications: ${res.statusText}`);

			const d = await res.json();
			return d as { notifications: Notification[], total: number };
		},
		...queryOptions,
	});

	return (
		<Card>
			<AdminSendNotificationModal userId={userId} show={showModal} onClose={() => setShowModal(false)} />
			<Card.Header>
        User&apos;s Notifications
				<button className='btn btn-success' onClick={() => setShowModal(true)}>
					<FontAwesomeIcon icon={faAdd} />
					Notification
				</button>
			</Card.Header>
			<Card.Body className='table-responsive'>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Title</Table.Header>
						<Table.Header>Text</Table.Header>
						<Table.Header>Created At</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || data == null ?
								generatePlaceholderTable(10, 3)
								: data.notifications.map((notification, index) => (
									<tr key={index}>
										<td>{notification.title}</td>
										<td>{notification.text}</td>
										<td>
											{format(new Date().getTime() - (new Date().getTime() - new Date(notification.createdAt).getTime()))}
										</td>
									</tr>
								))
							:
							<tr>
								<td colSpan={3} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to fetch user\'s notifications.'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				<Table.PaginationFooter isLoading={isLoading} total={data?.total} page={page} setPage={setPage} />
			</Card.Body>
		</Card>
	);
}