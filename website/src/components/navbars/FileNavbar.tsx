import { faSearch, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { queryOptions, signOutOptions } from '@/utils/functions';
import { useDebounce } from '@/components/Hooks/useDebounce';
import { SearchFileModal } from '@/components/Modals';
import { useQuery } from '@tanstack/react-query';
import { NotificationBell } from '@/components';
import type { PageProps } from '@/types/pages';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import API from '@/services/api';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function FileNavBar({ user }: PageProps) {
	const [searchQuery, setSearchQuery] = useState({
		query: '',
		fileType: '0',
		updatedSince: '0',
	});
	const [showSearchModal, setShowSearchModal] = useState(false);
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const router = useRouter();

	// Update to only use useStates not from documents
	const { data } = useQuery({
		queryKey: ['search', debouncedSearchQuery],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams(debouncedSearchQuery);
			return API.FILE.search(signal, params);
		},
		enabled: debouncedSearchQuery.query.length > 1,
		...queryOptions,
	});

	return (
		<nav className="navbar navbar-expand sticky-top" style={{ backgroundColor: '#ffffff' }}>
			<div className="navbar-collapse w-100 dual-collapse2">
				<ul className="navbar-nav me-auto mb-2 mb-lg-0">
					<li className="nav-item">
						<span className="searchBar">
							<form action="/search" method="GET">
								<div className="input-group mb-3" style={{ width:'40vw' }}>
									<div className="input-group-prepend">
										<button id="searchIconBtn" type="submit" className="input-group-text" style={{ backgroundColor:'#f4f4f4', border:'none', borderRadius:'8px 0px 0px 8px', height:'40px' }} data-toggle="tooltip" data-placement="bottom" title="Search">
											<FontAwesomeIcon icon={faSearch} />
										</button>
									</div>
									<input onChange={(e) => setSearchQuery((q) => ({ ...q, query: e.target.value }))} type="text" id="myInput" className="form-input form-control text-truncate" style={{ border:'none', backgroundColor:'#f4f4f4' }} placeholder="Search files and folders" name="query" autoComplete="off" />
									{data && data.files.length >= 1 && (
										<div className="autocomplete-items">
											{data.files.slice(0, 5).map((file) => (
												<Link style={{ textDecoration: 'none', color: 'black' }}	href={`/files${file.path}`} key={file.path}>
													<div className="d-flex flex-column ms-2">
														<span className="fw-bold text-truncate" >{file.name}</span>
														<span className="text-muted small" style={{ height: '20px', overflow: 'hidden' }}>
															{file.path}
														</span>
													</div>
												</Link>
											))}
										</div>
									)}
									<div className="input-group-append" id="filter">
										<div className="dropup-center dropdown">
											<button className="btn btn-outline-secondary dropdown-toggle" style={{ backgroundColor:'#f4f4f4', borderRadius:'0px 8px 8px 0px', border:'none', color:'#505762', height:'40px' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
												<FontAwesomeIcon icon={faSlidersH} />
											</button>
											<div className="dropdown-menu dropdown-menu-end" style={{ width:'100%', padding:'5px' }} >
												<div className="form-group">
													<label htmlFor="inputGroupSelect01">File type(s)</label>
													<select className="form-select" id="fileTypeSelector" name="fileType" onChange={(e) => setSearchQuery((q) => ({ ...q, fileType: e.target.value }))}>
														<option value="0">Any type</option>
														<option value="1">Files</option>
														<option value="2">Folders</option>
													</select>
												</div>
												<div className="form-group">
													<label htmlFor="inputGroupSelect01">Date updated</label>
													<select className="form-select" id="dateUpdatedSelector" name="dateUpdated" onChange={(e) => setSearchQuery((q) => ({ ...q, updatedSince: e.target.value }))}>
														<option value="0">Any time</option>
														<option value="1">Past day</option>
														<option value="2">Past week</option>
														<option value="3">Past month</option>
														<option value="4">Past year</option>
													</select>
												</div>
											</div>
										</div>
									</div>
								</div>
							</form>
						</span>
						<span className="mobile-searchBar">
							<button id="searchIconBtn" type="submit" className="input-group-text" style={{ backgroundColor:'#f4f4f4', border:'none', borderRadius:'8px', height:'40px' }} onClick={() => setShowSearchModal(true)}>
								<FontAwesomeIcon icon={faSearch} />
							</button>
							<SearchFileModal show={showSearchModal} onClose={() => setShowSearchModal(false)} />
						</span>
					</li>
				</ul>
				<ul className="navbar-nav ml-auto">
					<NotificationBell notifications={user!.notifications} />
					&nbsp;
					<li className="nav-item">
						<a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							<Image src={user!.image ?? `/avatar/${user!.id}`} width={25} height={25} className="rounded-circle" alt="User avatar" /> {user!.name}
						</a>
						<div className="dropdown-menu dropdown-menu-end">
							<Link className="dropdown-item text-dark" href="/settings">Settings</Link>
							<Link className="dropdown-item text-dark" href="/files">My files</Link>
							{user!.role == 'admin' && <Link className="dropdown-item text-dark" href="/admin">Admin</Link>}
							<div className="dropdown-divider"></div>
							<a className="dropdown-item" href="#" onClick={() => authClient.signOut(signOutOptions(router))} id="logout">Logout</a>
						</div>
					</li>
				</ul>
			</div>
		</nav>
	);
}
