import { format, formatBytes, queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';
import type { File } from '@prisma/client';
import { useState } from 'react';
import Link from 'next/link';

interface Props {
	userId?: string;
}

export default function AdminRecentUploadsCards({ userId }: Props) {
	const [page, setPage] = useState(0);

	const { data, isLoading, error } = useQuery({
		queryKey: userId ? ['recentUploads', page ] : [`recentUploads_${userId}`, page, userId],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/files/recently-uploaded?page=${page}${userId ? `&userId=${userId}` : ''}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch recently uploaded files: ${res.statusText}`);

			const d = await res.json();
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
							{userId == undefined && <Table.Header>User</Table.Header>}
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
												{userId == undefined && (
													<td><Link href={`/admin/users/${file.userId}`}>{file.userId}</Link></td>
												)}
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
				<Table.PaginationFooter isLoading={isLoading} total={data?.total} page={page} setPage={setPage} />
			</Card.Body>
		</Card>
	);
}