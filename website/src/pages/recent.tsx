import { faSortUp, faSortDown, faSort, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { queryOptions, useQuery } from '@tanstack/react-query';
import FileDetail from '@/components/Tables/FileDetailCell';
import type { UserHistoryWithFile } from '@/types/database';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { useEffect, useState } from 'react';
import { authClient } from '@/auth/client';
import { format } from '@/utils/functions';
import FileLayout from '@/layouts/file';
import type { User } from 'better-auth';
import { Table } from '@/components';
import API from '@/services/api';

type sortKeyTypes = 'name' | 'viewedAt'
type SortOrder = 'asc' | 'desc';

export default function Recent() {
	const { data: session } = authClient.useSession();
	const [sortKey, setSortKey] = useState<sortKeyTypes>('viewedAt');
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
	const [filters, setFilters] = useState<string[]>(['']);
	const [activeFilters, setActiveFilters] = useState<string[]>(['']);
	const { showToast } = useToast();

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['recent', sortKey, sortOrder],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ sortBy: sortKey, sortOrder });
			const d = await API.SESSION.fetchRecentlyViewed(signal, params);
			setFilters([...new Set((d.files as UserHistoryWithFile[]).map(c => `*.${c.file.name.split('.').at(-1)}`))]);

			return d;
		},
		...queryOptions,
	});

	const handleFilterChange = async (type: string) => {
		try {
			await refetch();
			const newActiveFilters =
			activeFilters.includes(type)
				? activeFilters.filter(filter => filter !== type)
				: [...activeFilters, type];

			let newFilteredHistory: UserHistoryWithFile[] = [];
			if (newActiveFilters.length == 1) {
				newFilteredHistory = data?.files ?? [];
			} else {
				newFilteredHistory = (data?.files ?? []).filter(s => {
					return newActiveFilters.includes(`*.${s.file.name.split('.').at(-1)}`);
				});
			}

			if (data) data.files = newFilteredHistory;
			setActiveFilters(newActiveFilters);
		} catch (err) {
			console.log(err);
		}
	};

	function updateSortKey(key: sortKeyTypes) {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		setSortKey(key);
	}

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<FileLayout user={session.user as User} activeTab='recent' tabName='Recent files'>
			<div className="d-flex flex-row justify-content-between">
				<h5><b>Recently viewed files</b></h5>
				<div className="dropdown">
					<button className="input-group-text dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" style={{ backgroundColor:'#f4f4f4', border:'none', borderRadius:'8px', height:'40px' }}>
						<FontAwesomeIcon icon={faFilter} />
					</button>
					<ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1" style={{ padding: '8px' }}>
						{filters.map(type => (
							<li className="form-check" key={type}>
								<input className="form-check-input" type="checkbox" id="flexCheckDefault" checked={activeFilters.includes(type)} onChange={() => handleFilterChange(type)} />
								<label className="form-check-label" htmlFor="flexCheckDefault">
									{type}
								</label>
							</li>
						))}
					</ul>
				</div>
			</div>
			{isLoading || data == null ?
				<p>Loading</p> :
				<Table>
					<Table.HeaderRow>
						<Table.Header onClick={() => updateSortKey('name')} style={{ cursor: 'pointer' }}>
							Name <FontAwesomeIcon icon={sortKey == 'name' ? (sortOrder == 'asc' ? faSortUp : faSortDown) : faSort} />
						</Table.Header>
						<Table.Header onClick={() => updateSortKey('viewedAt')} style={{ cursor: 'pointer' }}>
							Accessed on <FontAwesomeIcon icon={sortKey == 'viewedAt' ? (sortOrder == 'asc' ? faSortUp : faSortDown) : faSort} />
						</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{data.files.map(entry => (
							<tr key={entry.id}>
								<FileDetail file={entry.file} />
								<td>{format(new Date().getTime() - (new Date().getTime() - new Date(entry.viewedAt).getTime()))}</td>
							</tr>
						))}
					</Table.Body>
				</Table>
			}
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const data = await API.SESSION.fetchCurrentSession(context.req.headers.cookie || '');
	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		// Get the path from the URL
		const path = [context.params?.files].flat();
		return { props: { path: path.join('/') } };
	}
}