import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function FileNavBar() {
	const { data: session } = useSession();

	return (
		<nav className="navbar navbar-expand">
			<div className="navbar-collapse w-100 dual-collapse2">
				<ul className="navbar-nav me-auto mb-2 mb-lg-0">
					<li className="nav-item">
						<span className="searchBar">
							<form action="/files/search" method="post">
								<div className="input-group mb-3" style={{ width:'40vw' }}>
									<div className="input-group-prepend">
										<button id="searchIconBtn" type="submit" className="input-group-text" style={{ backgroundColor:'#f4f4f4', border:'none', borderRadius:'8px 0px 0px 8px', height:'40px' }} data-toggle="tooltip" data-placement="bottom" title="Search"><i className="fas fa-search"></i></button>
									</div>
									<input type="text" id="myInput" className="form-input form-control text-truncate" style={{ border:'none', backgroundColor:'#f4f4f4' }} placeholder="Search files and folders" name="search" autoComplete="off" />
									<div className="input-group-append" id="filter">
										<div className="dropup-center dropdown">
											<button className="btn btn-outline-secondary dropdown-toggle" style={{ backgroundColor:'#f4f4f4', borderRadius:'0px 8px 8px 0px', border:'none', color:'#505762', height:'40px' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
    										<i className="fas fa-sliders-h"></i>
											</button>
											<div className="dropdown-menu p-4" style={{ width:'100%', padding:'15px', boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.25)' }} >
												<div className="form-group">
													<label htmlFor="inputGroupSelect01">File type(s)</label>
													<select className="form-select" id="inputGroupSelect01" name="fileType">
														<option value="0" selected>Any type</option>
														<option value="1">Files</option>
														<option value="2">Folders</option>
													</select>
												</div>
												<div className="form-group">
													<label htmlFor="inputGroupSelect01">Date updated</label>
													<select className="form-select" id="inputGroupSelect01" name="dateUpdated">
														<option value="0" selected>Any time</option>
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
					</li>
				</ul>
				<ul className="navbar-nav ml-auto">
					<li className="nav-item">
						<div className="dropdown mr-1" id="notifications">
							<a className="nav-link" href="" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
								<i className="fas fa-bell" id="notifIcons"></i>
							</a>
							<div className="dropdown-menu dropdown-menu-end p-4 text-muted" style={{ width: '300px' }}>
								<h6 className="dropdown-header">Notifications - 0</h6>
								<p className="mb-0">You currently have no notifications.</p>
							</div>
						</div>
					</li>
					<li className="nav-item">
						<a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							<Image src={session?.user?.image ? `/avatar/${session?.user?.image}` : '/default-avatar.webp'} width={25} height={25} className="rounded-circle" alt="User avatar" />{session?.user?.name}
						</a>
						<div className="dropdown-menu dropdown-menu-end">
							<Link className="dropdown-item text-dark" href="/user/dashboard">Dashboard</Link>
							<Link className="dropdown-item text-dark" href="/files">My files</Link>
							<div className="dropdown-divider"></div>
							<a className="dropdown-item" href="/user/logout" id="logout">Logout</a>
						</div>
					</li>
				</ul>
			</div>
		</nav>
	);
}
