import { format, formatBytes, queryOptions } from '@/utils/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { UserWithCount } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';
import { useState } from 'react';
import Link from 'next/link';

interface Props {
	storageId?: string;
}

export default function AdminUserTableCards({ storageId }: Props) {
	const [page, setPage] = useState(0);
	const [name, setName] = useState('');
	const [dir, setDir] = useState<'desc' | 'asc'>('desc');
	const [header, setHeader] = useState<'createdAt' | 'lastActive' | 'uploadedFiles' | 'name'>('createdAt');

	const { data, isLoading, error } = useQuery({
		queryKey: storageId ? ['users', page, name, dir, header, storageId] : ['users', page, name, dir, header],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/users?include=group&page=${page}&name=${name}&sortBy=${header}&sortOrder=${dir}${storageId ? `&storageId=${storageId}` : ''}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);

			const d = await res.json();
			return d as { users: UserWithCount[], total: number };
		},
		...queryOptions,
	});

	function updateSorting(head: 'createdAt' | 'lastActive' | 'uploadedFiles' | 'name') {
		setDir(dir == 'asc' ? 'desc' : 'asc');
		setHeader(head);
	}

	return (
		<Card>
			<Card.Header>
				All users
			</Card.Header>
			<Card.Body>
				<div className="form-inline mr-auto my-2 my-md-0 mw-100 col-lg-6">
					<div className="input-group mb-3">
						<input type="text" className="form-control bg-light border-0 small" placeholder="Search for..." aria-label="Recipient's username" aria-describedby="basic-addon2" onChange={(e) => setName(e.target.value)} />
						<button className="btn btn-outline-primary" type="button">
							<FontAwesomeIcon icon={faSearch} />
						</button>
					</div>
				</div>
				<div className="table-responsive">
					<Table>
						<Table.HeaderRow>
							<Table.Header>Name</Table.Header>
							<Table.Header style={{ cursor: 'pointer' }} onClick={() => updateSorting('createdAt')}>
								Joined
								&nbsp;
								<FontAwesomeIcon icon={header == 'createdAt' ? dir == 'asc' ? faSortUp : faSortDown : faSort} />
							</Table.Header>
							<Table.Header style={{ cursor: 'pointer' }} onClick={() => updateSorting('lastActive')}>
								Last active
								&nbsp;
								<FontAwesomeIcon icon={header == 'lastActive' ? dir == 'asc' ? faSortUp : faSortDown : faSort} />
							</Table.Header>
							<Table.Header style={{ cursor: 'pointer' }} onClick={() => updateSorting('uploadedFiles')}>
								Uploaded files
								&nbsp;
								<FontAwesomeIcon icon={header == 'uploadedFiles' ? dir == 'asc' ? faSortUp : faSortDown : faSort} />
							</Table.Header>
							<Table.Header>Utilisation</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{error == null ?
								isLoading || data == null ? (
									[0, 0, 0, 0, 0, 0, 0, 0].map((_, index) => (
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
									data?.users.map((u) => (
										<tr key={u.id}>
											<td scope="row"><Link href={`/admin/users/${u.id}`}>{u.name}</Link></td>
											<td>{new Date(u.createdAt).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
											<td>{format(new Date().getTime() - (new Date().getTime() - new Date(u.activity[0]?.createdAt ?? u.updatedAt).getTime()))}</td>
											<td>{u._count?.files}</td>
											<td>{formatBytes(u.totalStorageSize)} / 5GB</td>
										</tr>
									))
								) :
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
			</Card.Body>
		</Card>
	);
}