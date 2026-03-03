import { format, formatBytes, generatePlaceholderTable, queryOptions } from '@/utils/functions';
import type { AdminListActivitiesCardProps } from '@/types/Components/Card';
import { Table, CollapsibleCard } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import API from '@/services/api';
import Link from 'next/link';

export default function AdminListRecentUploadsCard({ userId }: AdminListActivitiesCardProps) {
	const [page, setPage] = useState(0);

	const { data, isLoading, error } = useQuery({
		queryKey: userId ? ['recentUploads', page, userId] : ['recentUploads', page ],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ page:`${page}` });
			if (userId) params.append('userId', userId);

			return API.ADMIN.fetchRecentlyUploadedFiles(signal, params);
		},
		...queryOptions,
	});

	return (
		<CollapsibleCard className='mb-4'>
			<CollapsibleCard.Header id="recentUploads">
				Recent uploads
			</CollapsibleCard.Header>
			<CollapsibleCard.Body id="recentUploads">
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
									generatePlaceholderTable(20, userId == undefined ? 5 : 4)
									:	data.files.map((file, index) => (
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
								:
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
			</CollapsibleCard.Body>
		</CollapsibleCard>
	);
}