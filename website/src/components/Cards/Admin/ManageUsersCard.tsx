import type { AdminManageUsersCardProps, ManageUsersFilterProps } from '@/types/Components/Card';
import { format, formatBytes, generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { faSearch, faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Table, CollapsibleCard } from '@/components';
import { useQuery } from '@tanstack/react-query';
import API from '@/services/api';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminManageUsersCard({ storageId }: AdminManageUsersCardProps) {
	const [page, setPage] = useState(0);
	const [name, setName] = useState('');
	const [filters, setFilters] = useState<ManageUsersFilterProps>({
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});

	const { data, isLoading, error } = useQuery({
		queryKey: storageId ? ['users', page, name, filters, storageId] : ['users', page, name, filters],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ page: `${page}`, name, ...filters, storageId: storageId ?? '' });
			return API.ADMIN.fetchAllUsers(signal, params);
		},
		...queryOptions,
	});

	return (
		<CollapsibleCard className='mb-4'>
			<CollapsibleCard.Header id="allUsers">
				All users
			</CollapsibleCard.Header>
			<CollapsibleCard.Body id="allUsers">
				<div className="form-inline mr-auto my-2 my-md-0 mw-100 col-lg-6">
					<div className="input-group mb-3">
						<input type="text" className="form-control bg-light border-0 small" placeholder="Search for..." aria-label="Search for a user" onChange={(e) => setName(e.target.value)} />
						<button className="btn btn-outline-primary" type="button" aria-label="Search">
							<FontAwesomeIcon icon={faSearch} />
							<span className="visually-hidden">Search</span>
						</button>
					</div>
				</div>
				<div className="table-responsive">
					<Table>
						<Table.HeaderRow>
							<Table.Header>Name</Table.Header>
							<Table.Header style={{ cursor: 'pointer' }} onClick={() => setFilters({ sortBy: 'createdAt', sortOrder: filters.sortOrder == 'asc' ? 'desc' : 'asc' })}>
								Joined
								&nbsp;
								<FontAwesomeIcon icon={filters.sortBy == 'createdAt' ? filters.sortOrder == 'asc' ? faSortUp : faSortDown : faSort} />
							</Table.Header>
							<Table.Header style={{ cursor: 'pointer' }} onClick={() => setFilters({ sortBy: 'lastActive', sortOrder: filters.sortOrder == 'asc' ? 'desc' : 'asc' })}>
								Last active
								&nbsp;
								<FontAwesomeIcon icon={filters.sortBy == 'lastActive' ? filters.sortOrder == 'asc' ? faSortUp : faSortDown : faSort} />
							</Table.Header>
							<Table.Header style={{ cursor: 'pointer' }} onClick={() => setFilters({ sortBy: 'uploadedFiles', sortOrder: filters.sortOrder == 'asc' ? 'desc' : 'asc' })}>
								Uploaded files
								&nbsp;
								<FontAwesomeIcon icon={filters.sortBy == 'uploadedFiles' ? filters.sortOrder == 'asc' ? faSortUp : faSortDown : faSort} />
							</Table.Header>
							<Table.Header>Utilisation</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{error == null ?
								isLoading || data == null ?
									generatePlaceholderTable(8, 5)
									: data?.users.map((u) => (
										<tr key={u.id}>
											<td scope="row"><Link href={`/admin/users/${u.id}`}>{u.name}</Link></td>
											<td>{new Date(u.createdAt).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
											<td>{format(new Date().getTime() - (new Date().getTime() - new Date(u.activity[0]?.createdAt ?? u.updatedAt).getTime()))}</td>
											<td>{u._count?.files}</td>
											<td>{formatBytes(u.totalStorageSize)} / {formatBytes(u.plan.maxStorageSize)}</td>
										</tr>
									))
								:
								<tr>
									<td colSpan={5} className="text-center text-danger fw-bold">
										{error?.message ?? 'Failed to load users'}
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