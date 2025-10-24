import { queryOptions, useQuery } from '@tanstack/react-query';
import Card from '../UI/Card';
import { AuditLog } from '@prisma/client';
import Table from '../UI/Table';
import { format, parseUserAgent } from '@/utils/functions';
import { AuditLogEventName } from '@prisma/client';
import { useState } from 'react';
import { faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

export default function AdminAuditLogTableCard() {
	const [page, setPage] = useState(0);
	const [eventName, setEventName] = useState<string>('');
	const [dir, setDir] = useState<'desc' | 'asc'>('desc');

	const { data, isLoading, error } = useQuery({
		queryKey: ['AdminAuditLogs', page, eventName, dir],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/logs?page=${page}${eventName == '' ? '' : `&eventName=${eventName}`}&sortOrder=${dir}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch CRON jobs: ${res.statusText}`);

			const d = await res.json();
			return d as { logs: AuditLog[], total: number };
		},
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>Audit logs</Card.Header>
			<Card.Body>
				<div className='table-responsive'>
					<Table>
						<Table.HeaderRow>
							<Table.Header>
								<select className="form-select" aria-label="Default select example" onChange={(e) => {setEventName(e.target.value); setPage(0);}}>
									<option value="" selected>Name</option>
									{Object.keys(AuditLogEventName).map(e => (
										<option value={e} key={e}>{e}</option>
									))}
								</select>
							</Table.Header>
							<Table.Header>Message</Table.Header>
							<Table.Header>UserId</Table.Header>
							<Table.Header>User Agent</Table.Header>
							<Table.Header>IP</Table.Header>
							<Table.Header>Success ?</Table.Header>
							<Table.Header style={{ cursor: 'pointer' }} onClick={() => setDir(dir == 'asc' ? 'desc' : 'asc')}>
								Created at
								&nbsp;
								<FontAwesomeIcon icon={dir == 'asc' ? faSortUp : faSortDown} />
							</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{error == null ?
								isLoading || data == null ? (
									Array.from({ length: 20 }, (_, i) => i).map((_, index) => (
										<tr key={index}>
											{Array.from({ length: 7 }, (__, i) => i).map((__) => (
												<td className="placeholder-glow" key={__}>
													<span className="placeholder col-12"></span>
												</td>
											))}
										</tr>
									))
								) : (
									data.logs.map(log => (
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
								) :
								<tr>
									<td colSpan={5} className="text-center text-danger fw-bold">
										{error?.message ?? 'Failed to load Audit logs'}
									</td>
								</tr>
							}
						</Table.Body>
					</Table>
				</div>
				<Table.PaginationFooter isLoading={isLoading} total={data?.total} page={page} setPage={setPage} />
			</Card.Body>
		</Card>
	);
}