import { format, generatePlaceholderTable, parseUserAgent } from '@/utils/functions';
import { AuditLogEventName, type AuditLog } from '@/types/generated/browser';
import { faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import type { ListAuditLogsFilterProps } from '@/types/Components/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { Table, CollapsibleCard } from '@/components';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminListAuditLogsCard() {
	const [page, setPage] = useState(0);
	const [filters, setFilters] = useState<ListAuditLogsFilterProps>({
		eventName: '',
		sortOrder: 'desc',
	});

	const { data, isLoading, error } = useQuery({
		queryKey: ['AdminAuditLogs', page, filters],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({
				...filters,
			});
			if (filters.eventName == '') params.delete('name');

			const res = await fetch(`/api/admin/logs?page=${page}&${params}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`);

			const d = await res.json();
			return d as { logs: AuditLog[], total: number };
		},
		...queryOptions,
	});

	useEffect(() => {
		console.log(filters);
	}, [filters]);

	return (
		<CollapsibleCard className='mb-4'>
			<CollapsibleCard.Header id="auditLogs">
				Audit logs
			</CollapsibleCard.Header>
			<CollapsibleCard.Body className='table-responsive' id="auditLogs">
				<Table>
					<Table.HeaderRow>
						<Table.Header>
							<select className="form-select" onChange={(e) => {setFilters({ eventName: e.target.value, sortOrder: 'desc' }); setPage(0);}}>
								<option value="" selected>Name</option>
								{Object.keys(AuditLogEventName).sort((a, b) => a.localeCompare(b)).map(e => (
									<option value={e} key={e}>{e}</option>
								))}
							</select>
						</Table.Header>
						<Table.Header>Message</Table.Header>
						<Table.Header>UserId</Table.Header>
						<Table.Header>User Agent</Table.Header>
						<Table.Header>IP</Table.Header>
						<Table.Header>Success ?</Table.Header>
						<Table.Header style={{ cursor: 'pointer' }} onClick={() => setFilters((f) => ({ ...f, sortOrder: f.sortOrder == 'asc' ? 'desc' : 'asc' })) }>
							Created at
							&nbsp;
							<FontAwesomeIcon icon={filters.sortOrder == 'asc' ? faSortUp : faSortDown} />
						</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || data == null ?
								generatePlaceholderTable(20, 7)
								: data.logs.map(log => (
									<tr key={log.id}>
										<td>{log.eventId}</td>
										<td className='text-wrap'>{log.message}</td>
										<td>{log.userId ? (<Link href={`/admin/users/${log.userId}`}>{log.userId}</Link>) : '-'}</td>
										<td>{log.userAgent ? parseUserAgent(log.userAgent) : '-'}</td>
										<td>{log.ipAddress ?? '-'}</td>
										<td>{log.success ? 'Yes' : 'No'}</td>
										<td>{format(new Date().getTime() - (new Date().getTime() - new Date(log.createdAt).getTime()))}</td>
									</tr>
								))
							:
							<tr>
								<td colSpan={7} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to fetch audit logs'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				<Table.PaginationFooter isLoading={isLoading} total={data?.total} page={page} setPage={setPage} />
			</CollapsibleCard.Body>
		</CollapsibleCard>
	);
}