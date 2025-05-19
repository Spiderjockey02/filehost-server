import { format, formatBytes } from '@/utils/functions';
import Link from 'next/link';
import Table from '../UI/Table';
import { useEffect, useState } from 'react';
import type { File } from '@prisma/client';
import Card from '../UI/Card';

export default function AdminRecentUploadsCards() {
	const [page, setPage] = useState(0);
	const [total, setTotal] = useState(0);
	const [uploaded, setUploaded] = useState<File[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Fetch recent files
		(async () => {
			try {
				setIsLoading(true);
				const res = await fetch(`/api/admin/files/recently-uploaded?page=${page}`);
				const { files, total: totalFiles } = await res.json();
				setUploaded(files);
				setTotal(totalFiles);
				setIsLoading(false);
			} catch (err) {
				console.error(err);
			}
		})();
	}, [page]);

	return (
		<Card>
			<Card.Header>
				Recent uploads
			</Card.Header>
			<Card.Body>
				<Table>
					<Table.HeaderRow>
						<Table.Header>File Id</Table.Header>
						<Table.Header>MIME Type</Table.Header>
						<Table.Header>Size</Table.Header>
						<Table.Header>Date</Table.Header>
						<Table.Header>User</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{isLoading ?
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
								uploaded.map((file, index) => (
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
							)}
					</Table.Body>
				</Table>
				<div className="d-flex flex-row justify-content-between">
					<nav aria-label="Page navigation">
						<ul className="pagination">
							<li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
								<button className="page-link" onClick={() => setPage(Math.max(page - 1, 0))} aria-label="Previous">
									<span aria-hidden="true">&laquo;</span>
								</button>
							</li>
							<li className="page-item disabled">
								<span className="page-link">{page} / {Math.floor(total / 20)}</span>
							</li>
							<li className={`page-item ${page == Math.floor(total / 20) ? 'disabled' : ''}`}>
								<button className="page-link" onClick={() => setPage(Math.min(page + 1, 20))} aria-label="Next">
									<span aria-hidden="true">&raquo;</span>
								</button>
							</li>
						</ul>
					</nav>
					<div className="d-flex align-items-center mb-2">
						<p className="mb-0 me-2">
              Showing {page * 20} to {Math.min((page + 1) * 20, total)} out of {total}
						</p>
					</div>
				</div>
			</Card.Body>
		</Card>
	);
}