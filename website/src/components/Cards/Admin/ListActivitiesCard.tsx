import { format, formatBytes, generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { faCircleInfo, faDownLong, faUpLong } from '@fortawesome/free-solid-svg-icons';
import type { AdminListActivitiesCardProps } from '@/types/Components/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminActivityDetailsModal } from '@/components/Modals';
import { Table, CollapsibleCard } from '@/components';
import type { UserActivity } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { ChangeEvent, useState } from 'react';
import Link from 'next/link';

export default function AdminListActivitiesCard({ userId }: AdminListActivitiesCardProps) {
	const [activeModal, setActiveModal] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [filters, setFilters] = useState({
		method: '',
		status: '',
	});

	const { data, isLoading, error } = useQuery({
		queryKey: userId ? ['recentActivity', page, userId, filters] : ['recentActivity', page, filters],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({
				page: `${page}`,
				...filters,
			});

			const res = await fetch(`/api/admin/network/list?${userId ? `userId=${userId}&` : ''}${params.toString()}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch recent activity: ${res.statusText}`);

			const d = await res.json();
			return d as { activity: UserActivity[], total: number };
		},
		...queryOptions,
	});

	function onColumnChange(e: ChangeEvent<HTMLSelectElement>, type: 'method' | 'status') {
		e.preventDefault();
		setFilters((f) => ({ ...f, [type]: e.target.value }));
		setPage(0);
	}

	return (
		<CollapsibleCard className='mb-4'>
			<CollapsibleCard.Header id="recentActivity">
				Recent activity
			</CollapsibleCard.Header>
			<CollapsibleCard.Body id="recentActivity" className='table-responsive' >
				<Table>
					<Table.HeaderRow>
						<Table.Header>
							<select className="form-select" onChange={(e) => onColumnChange(e, 'method')}>
								<option selected value="">Method</option>
								{['DELETE', 'GET', 'PATCH', 'POST', 'PUT'].map(i => (
									<option value={i} key={i}>{i}</option>
								))}
							</select>
						</Table.Header>
						<Table.Header>
							<select className="form-select" onChange={(e) => onColumnChange(e, 'status')}>
								<option selected value="">Status Code</option>
								{[200, 206, 304, 401, 403, 404, 412, 416, 429, 500].map(i => (
									<option value={i} key={i}>{i}</option>
								))}
							</select>
						</Table.Header>
						<Table.Header>Endpoint</Table.Header>
						{userId == undefined && <Table.Header className='hide-on-mobile'>User ID</Table.Header>}
						<Table.Header className='hide-on-mobile text-center'>Traffic</Table.Header>
						<Table.Header>Timestamp</Table.Header>
						<Table.Header className='text-center'>Info</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || data == null ?
								generatePlaceholderTable(20, userId == undefined ? 7 : 6)
								: data.activity.map((activity, index) => (
									<tr key={index}>
										<td>{activity.method}</td>
										<td>{activity.statusCode}</td>
										<td>{activity.endpoint.split('?')[0]}</td>
										{userId == undefined && <td className='hide-on-mobile'><Link href={`/admin/users/${activity.userId}`}>{activity.userId}</Link></td>}
										<td className='hide-on-mobile text-center'>
											{formatBytes(activity.outgoingBytes)} <FontAwesomeIcon icon={faUpLong} /> | {formatBytes(activity.incomingBytes)} <FontAwesomeIcon icon={faDownLong} />
										</td>
										<td>
											{format(new Date().getTime() - (new Date().getTime() - new Date(activity.createdAt).getTime()))}
										</td>
										<td className='text-center'>
											<button className='btn' onClick={() => setActiveModal(activity.id)} style={{ padding: '0' }}>
												<FontAwesomeIcon size='lg' icon={faCircleInfo} />
											</button>
										</td>
									</tr>
								))
							:
							<tr>
								<td colSpan={userId == undefined ? 7 : 6} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to fetch recent activity.'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				<Table.PaginationFooter isLoading={isLoading} total={data?.total} page={page} setPage={setPage} />
				{(activeModal && data) && <AdminActivityDetailsModal show={true} activity={data.activity.find((a) => a.id === activeModal)!} onClose={() => setActiveModal(null)} />}
			</CollapsibleCard.Body>
		</CollapsibleCard>
	);
}