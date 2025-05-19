import { UserWithCount } from '@/types/database';
import { format, formatBytes } from '@/utils/functions';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Table from '../UI/Table';

export default function AdminUserTableCards() {
	const [page, setPage] = useState(0);
	const [total, setTotal] = useState(0);
	const [users, setUsers] = useState<UserWithCount[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Fetch recent files
		(async () => {
			try {
				setIsLoading(true);
				const res = await fetch(`/api/admin/users?filters=group&page=${page}`);
				const { users: resUsers, total: totalUsers } = await res.json();
				setUsers(resUsers);
				setTotal(totalUsers);
				setIsLoading(false);
			} catch (err) {
				console.error(err);
			}
		})();
	}, [page]);

	return (
		<div className="table-responsive">
			<div className="form-inline mr-auto my-2 my-md-0 mw-100 col-lg-6">
				<div className="input-group mb-3">
					<input type="text" className="form-control bg-light border-0 small" placeholder="Search for..." aria-label="Recipient's username" aria-describedby="basic-addon2" />
					<button className="btn btn-outline-primary" type="button">
						<FontAwesomeIcon icon={faSearch} />
					</button>
				</div>
			</div>
			<Table>
				<Table.HeaderRow>
					<Table.Header>ID</Table.Header>
					<Table.Header>Name</Table.Header>
					<Table.Header>Joined</Table.Header>
					<Table.Header>Last login</Table.Header>
					<Table.Header>Uploaded files</Table.Header>
					<Table.Header>Utilisation</Table.Header>
				</Table.HeaderRow>
				<Table.Body>
					{isLoading ? (
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
								<td className="placeholder-glow">
									<span className="placeholder col-12"></span>
								</td>
							</tr>
						))
					) : (
						users?.map((u) => (
							<tr key={u.id}>
								<td scope="row"><Link href={`/admin/users/${u.id}`}>{u.id}</Link></td>
								<td>{u.name}</td>
								<td>{new Date(u.createdAt).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
								<td>{format(new Date().getTime() - (new Date().getTime() - new Date(u.updatedAt).getTime()))}</td>
								<td>{u._count?.files}</td>
								<td>{formatBytes(u.totalStorageSize)} / 5GB</td>
							</tr>
						))
					)}
				</Table.Body>
			</Table>
			<div className="d-flex flex-row align-items-center mt-3">
				<div className="d-flex align-items-center mb-2">
					<p className="mb-0 me-2">
            Showing {page * 20} to {Math.min((page + 1) * 20, total)} out of {total}
					</p>
				</div>
				{total > 20 ?
					<nav aria-label="Page navigation">
						<ul className="pagination">
							<li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
								<button className="page-link" onClick={() => setPage(Math.max(1 - 1, 0))} aria-label="Previous">
									<span aria-hidden="true">&laquo;</span>
								</button>
							</li>
							<li className="page-item">
								<button className="page-link" onClick={() => setPage(0)}>{0}</button>
							</li>
							<li className="page-item disabled">
								<span className="page-link">{page}</span>
							</li>
							<li className="page-item">
								<button className="page-link" onClick={() => setPage(Math.floor(total / 20))}>{Math.floor(total / 20)}</button>
							</li>
							<li className={`page-item ${page == Math.floor(total / 20) ? 'disabled' : ''}`}>
								<button className="page-link" onClick={() => setPage(Math.min(page + 1, 20))} aria-label="Next">
									<span aria-hidden="true">&raquo;</span>
								</button>
							</li>
						</ul>
					</nav>
					: null
				}
			</div>
		</div>
	);
}