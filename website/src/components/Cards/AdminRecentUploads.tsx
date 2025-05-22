import { format, formatBytes, queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';
import type { File } from '@prisma/client';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminRecentUploadsCards() {
	const [page, setPage] = useState(0);
	const [total, setTotal] = useState(0);

	const { data, isLoading, error } = useQuery({
		queryKey: ['recentUploads', page],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/files/recently-uploaded?page=${page}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch recently uploaded files: ${res.statusText}`);

			const d = await res.json();
			setTotal(d.total);
			return d as { files: File[], total: number };
		},
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>
				Recent uploads
			</Card.Header>
			<Card.Body>
				<div className='table-responsive'>
					<Table>
						<Table.HeaderRow>
							<Table.Header>File Id</Table.Header>
							<Table.Header>MIME Type</Table.Header>
							<Table.Header>Size</Table.Header>
							<Table.Header>Date</Table.Header>
							<Table.Header>User</Table.Header>
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
											</tr>
										))
									) : (
										data.files.map((file, index) => (
											<tr key={index}>
												<td>{file.id}</td>
												<td className='text-truncate' style={{ maxWidth: '300px' }}>
													<Link href={`https://mimetype.io/${file.mimetype}`} target="_blank">{file.mimetype}</Link>
												</td>
												<td>{formatBytes(file.size)}</td>
												<td>{format(new Date().getTime() - (new Date().getTime() - new Date(file.createdAt).getTime()))}</td>
												<td><Link href={`/admin/users/${file.userId}`}>{file.userId}</Link></td>
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
			</Card.Body>
		</Card>
	);
}