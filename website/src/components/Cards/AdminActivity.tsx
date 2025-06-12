import { format, formatBytes, queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';
import { useState } from 'react';
import { UserActivity } from '@prisma/client';
import Link from 'next/link';
import { faCircleInfo, faDownLong, faUpLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminActivityModal from '../Modals/AdminActivityModal';

interface Props {
	userId?: string;
}

export default function AdminActivityCard({ userId }: Props) {
	const [page, setPage] = useState(0);
	const [total, setTotal] = useState(0);
	const [method, setMethod] = useState('');
	const [status, setStatus] = useState('');


	const { data, isLoading, error } = useQuery({
		queryKey: userId ? ['recentActivity', page, method, status] : [`recentActivity_${userId}`, page, userId, method, status],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/network/list?page=${page}${userId ? `&userId=${userId}` : ''}&status=${status}&method=${method}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch recent activity: ${res.statusText}`);

			const d = await res.json();
			setTotal(d.total);
			return d as { activity: UserActivity[], total: number };
		},
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>
				Recent activity
			</Card.Header>
			<Card.Body>
				<div className='table-responsive'>
					<Table>
						<Table.HeaderRow>
							<Table.Header>
								<select className="form-select" aria-label="Default select example" onChange={(e) => setMethod(e.target.value)}>
									<option selected>Method</option>
									<option value="GET">GET</option>
									<option value="POST">POST</option>
									<option value="PUT">PUT</option>
									<option value="DELETE">DELETE</option>
								</select>
							</Table.Header>
							<Table.Header>Endpoint</Table.Header>
							<Table.Header>
								<select className="form-select" aria-label="Default select example" onChange={(e) => setStatus(e.target.value)}>
									<option selected>Status Code</option>
									<option value="200">200</option>
									<option value="206">206</option>
									<option value="304">304</option>
									<option value="401">401</option>
									<option value="403">403</option>
									<option value="404">404</option>
									<option value="412">412</option>
									<option value="416">416</option>
									<option value="500">500</option>
								</select>
							</Table.Header>
							<Table.Header>Timestamp</Table.Header>
							{userId == undefined && <Table.Header>User ID</Table.Header>}
							<Table.Header className='hide-on-mobile text-center'>Traffic</Table.Header>
							<Table.Header className='text-center'>Info</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{error == null ?
								isLoading || data == null ?
									(
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((_, index) => (
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
												<td className="placeholder-glow hide-on-mobile">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
											</tr>
										))
									) : (
										data.activity.map((activity, index) => (
											<tr key={index}>
												<td>{activity.method}</td>
												<td>{activity.endpoint.split('?')[0]}</td>
												<td>{activity.statusCode}</td>
												<td>{format(new Date().getTime() - (new Date().getTime() - new Date(activity.createdAt).getTime()))}</td>
												{userId == undefined && <td><Link href={`/admin/users/${activity.userId}`}>{activity.userId}</Link></td>}
												<td className='hide-on-mobile text-center'>{formatBytes(activity.outgoingBytes)} <FontAwesomeIcon icon={faUpLong} /> | {formatBytes(activity.incomingBytes)} <FontAwesomeIcon icon={faDownLong} /></td>
												<td className='text-center'>
													<button className='btn' data-bs-toggle="modal" data-bs-target={`#${new Date(activity.createdAt).getTime()}`} style={{ padding: '0' }}>
														<FontAwesomeIcon size='lg' icon={faCircleInfo} />
													</button>
												</td>
											</tr>
										))
									) :
								<tr>
									<td colSpan={5} className="text-center text-danger fw-bold">
										{error?.message ?? 'Failed to load recently uploaded files'}
									</td>
								</tr>
							}
						</Table.Body>
					</Table>
				</div>
				<div className="d-flex flex-row justify-content-between">
					<div className="d-flex align-items-center">
						<p className="mb-0">
              Showing {page * 20 + 1} to {Math.min((page + 1) * 20, total)} out of {total}
						</p>
					</div>
					<nav aria-label="Page navigation">
						<ul className="pagination mb-0">
							<li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
								<button className="page-link" onClick={() => setPage(Math.max(page - 1, 0))} aria-label="Previous">
									<span aria-hidden="true">&laquo;</span>
								</button>
							</li>
							<li className="page-item disabled">
								<span className="page-link">{page + 1} / {Math.floor(total / 20) + 1}</span>
							</li>
							<li className={`page-item ${page == Math.floor(total / 20) ? 'disabled' : ''}`}>
								<button className="page-link" onClick={() => setPage(Math.min(page + 1, 20))} aria-label="Next">
									<span aria-hidden="true">&raquo;</span>
								</button>
							</li>
						</ul>
					</nav>
				</div>
				{data?.activity.map((activity) => (<AdminActivityModal key={activity.id} activity={activity} />))}
			</Card.Body>
		</Card>
	);
}