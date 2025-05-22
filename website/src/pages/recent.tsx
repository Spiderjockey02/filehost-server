import { useEffect, useState } from 'react';
import axios from 'axios';
import FileLayout from '@/layouts/file';
import React from 'react';
import { faSortUp, faSortDown, faSort, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Table from '@/components/UI/Table';
import FileDetail from '@/components/Tables/FileDetailCell';
import { authClient } from '@/auth/client';
import { UserHistoryWithFile } from '@/types/database';
import { User } from 'better-auth';
import { format } from '@/utils/functions';
import { GetServerSidePropsContext } from 'next';

type sortKeyTypes = 'Name' | 'Acc_On';
type SortOrder = 'ascn' | 'dscn';

export default function Recent() {
	const { data: session } = authClient.useSession();
	const [history, setHistory] = useState<UserHistoryWithFile[]>([]);
	const [sortKey, setSortKey] = useState<sortKeyTypes>('Acc_On');
	const [sortOrder, setSortOrder] = useState<SortOrder>('ascn');
	const [filters, setFilters] = useState<string[]>(['']);
	const [activeFilters, setActiveFilters] = useState<string[]>(['']);

	async function fetchFiles() {
		try {
			const { data } = await axios.get('/api/session/recently-viewed');
			setHistory(data.files);
			setFilters([...new Set((data.files as UserHistoryWithFile[]).map(c => c.file.name.split('.')[1]))]);
		} catch (err) {
			console.log(err);
		}
	}

	function updateSortKey(sort: sortKeyTypes) {
		switch(sort) {
			case 'Name': {
				const isAscending = sortOrder === 'ascn';
				setSortOrder(isAscending ? 'dscn' : 'ascn');
				console.log(history);
				const newHistory = history.sort((a, b) => {
					return isAscending ? a.file.name.localeCompare(b.file.name) : b.file.name.localeCompare(a.file.name);
				});
				setHistory(newHistory);
				setSortKey(sort);
				break;
			}
			case 'Acc_On': {
				const isAscending = sortOrder === 'ascn';
				setSortOrder(isAscending ? 'dscn' : 'ascn');

				setHistory(history.sort((a, b) => {
					const dateA = new Date(a.viewedAt);
					const dateB = new Date(b.viewedAt);
					return isAscending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
				}));
				setSortKey(sort);
				break;
			}
		}
	}

	const handleFilterChange = async (type: string) => {
		try {
			const newActiveFilters =
			activeFilters.includes(type)
				? activeFilters.filter(filter => filter !== type)
				: [...activeFilters, type];

			const { data } = await axios.get('/api/session/recently-viewed');
			let newFilteredHistory: UserHistoryWithFile[] = [];
			if (newActiveFilters.length == 1) {
				newFilteredHistory = (data.files as UserHistoryWithFile[]);
			} else {
				newFilteredHistory = (data.files as UserHistoryWithFile[]).filter(s => {
					return newActiveFilters.includes(s.file.name.split('.')[1]);
				});
			}

			setHistory(newFilteredHistory);
			setActiveFilters(newActiveFilters);
		} catch (err) {
			console.log(err);
		}
	};

	useEffect(() => {
		fetchFiles();
	}, []);

	if (session == null) return null;
	return (
		<FileLayout user={session.user as User} activeTab='recent'>
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
			<Table>
				<Table.HeaderRow>
					<Table.Header onClick={() => updateSortKey('Name')} style={{ cursor: 'pointer' }}>
						Name <FontAwesomeIcon icon={sortKey == 'Name' ? (sortOrder == 'ascn' ? faSortUp : faSortDown) : faSort} />
					</Table.Header>
					<Table.Header onClick={() => updateSortKey('Acc_On')} style={{ cursor: 'pointer' }}>
						Accessed on <FontAwesomeIcon icon={sortKey == 'Acc_On' ? (sortOrder == 'ascn' ? faSortUp : faSortDown) : faSort} />
					</Table.Header>
				</Table.HeaderRow>
				<Table.Body>
					{history.map(entry => (
						<tr key={entry.id}>
							<FileDetail file={entry.file} />
							<td>{format(new Date().getTime() - (new Date().getTime() - new Date(entry.viewedAt).getTime()))}</td>
						</tr>
					))}
				</Table.Body>
			</Table>
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
		headers: {
			cookie: context.req.headers.cookie || '',
		},
	});

	const data = await res.json();
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