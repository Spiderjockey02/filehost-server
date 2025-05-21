import { faSearch, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AutoComplete, FileNavBarProps } from '@/types/Components/Navbars';
import { NotificationBell, SearchFileModal } from '@/components';
import { useState, ChangeEvent } from 'react';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';

export default function FileNavBar({ user }: FileNavBarProps) {
	const [srchRes, setSrchRes] = useState<AutoComplete[]>([]);
	const router = useRouter();

	// Update to only use useStates not from documents
	async function autoComplete(e: ChangeEvent<HTMLInputElement>) {
		const search = e.target.value.trim();
		const fileType = document.getElementById('fileTypeSelector') as HTMLSelectElement;
		const dateUpdatedSelector = document.getElementById('dateUpdatedSelector') as HTMLSelectElement;
		if (search) {
			const { data } = await axios.get(`${window.origin}/api/files/search?query=${search}&fileType=${fileType.value}&updatedSince=${dateUpdatedSelector.value}`);
			setSrchRes(data.query);
		} else {
			setSrchRes([]);
		}
	}

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
									<input onChange={(e) => autoComplete(e)} type="text" id="myInput" className="form-input form-control text-truncate" style={{ border:'none', backgroundColor:'#f4f4f4' }} placeholder="Search files and folders" name="query" autoComplete="off" />
									{srchRes.length >= 1 && (
										<div className="autocomplete-items">
											{srchRes.slice(0, 5).map((file) => (
												<Link style={{ textDecoration: 'none', color: 'black' }}	href={`/files${file.path}`} key={file.path}>
													<div className="d-flex flex-column ms-2">
														<span className="fw-bold text-truncate" >{file.name}</span>
														<span className="text-muted small" style={{ height: '20px', overflow: 'hidden' }}>
															<ol className="breadcrumb">
																{file.path.split('/').length == 2 ?
																	<li className="breadcrumb-item">
																		/
																	</li>
																	:
																	file.path.split('/').slice(1, -1).map(seg => (
																		<li className="breadcrumb-item text-truncate" key={seg}>
																			{seg}
																		</li>
																	))
																}
															</ol>
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
													<select className="form-select" id="fileTypeSelector" name="fileType">
														<option value="0">Any type</option>
														<option value="1">Files</option>
														<option value="2">Folders</option>
													</select>
												</div>
												<div className="form-group">
													<label htmlFor="inputGroupSelect01">Date updated</label>
													<select className="form-select" id="dateUpdatedSelector" name="dateUpdated">
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
							<button id="searchIconBtn" type="submit" className="input-group-text" style={{ backgroundColor:'#f4f4f4', border:'none', borderRadius:'8px', height:'40px' }} data-bs-toggle="modal" data-bs-target="#exampleModal">
								<FontAwesomeIcon icon={faSearch} />
							</button>
						</span>
					</li>
				</ul>
				<ul className="navbar-nav ml-auto">
					<NotificationBell notifications={user.notifications} />
					&nbsp;
					<li className="nav-item">
						<a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							<Image src={user.image ?? '/avatar'} width={25} height={25} className="rounded-circle" alt="User avatar" /> {user.name}
						</a>
						<div className="dropdown-menu dropdown-menu-end">
							<Link className="dropdown-item text-dark" href="/settings">Settings</Link>
							<Link className="dropdown-item text-dark" href="/files">My files</Link>
							{user.role == 'admin' && <Link className="dropdown-item text-dark" href="/admin">Admin</Link>}
							<div className="dropdown-divider"></div>
							<a className="dropdown-item" href="#" onClick={() => authClient.signOut({ fetchOptions: {
								onSuccess: () => {
									router.push('/login');
								},
							} })} id="logout">Logout</a>
						</div>
					</li>
				</ul>
			</div>
			<SearchFileModal />
		</nav>
	);
}
