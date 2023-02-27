import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { User } from '../../types/next-auth';
import axios from 'axios';
import config from 'src/config';
import { useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
interface Props {
	user: User
}

interface AutoComplete {
	name: string
	path: string
}

export default function FileNavBar({ user }: Props) {
	const [text, setText] = useState<Array<AutoComplete>>([]);

	async function autoComplete(e: ChangeEvent<HTMLInputElement>) {
		const search = e.target.value;
		if (search) {
			const { data } = await axios.get(`${config.backendURL}/api/files/search?search=${search}`);
			setText(data.query);
		} else {
			setText([]);
		}
	}

	function deleteNotification(e: MouseEvent<HTMLButtonElement>, id:string) {
		e.preventDefault();
		alert(user.Notifications.find(i => i.id == id)?.text);
	}

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
									<input onChange={(e) => autoComplete(e)} type="text" id="myInput" className="form-input form-control text-truncate" style={{ border:'none', backgroundColor:'#f4f4f4' }} placeholder="Search files and folders" name="search" autoComplete="off" />
									{text.length >= 1 && (
										<div className="autocomplete-items">
											{text.map((_) => (
												<div key={_.name}>
													<a href={`/files/${_.path}`}>{_.name}</a>
												</div>
											))}
										</div>
									)}
									<div className="input-group-append" id="filter">
										<div className="dropup-center dropdown">
											<button className="btn btn-outline-secondary dropdown-toggle" style={{ backgroundColor:'#f4f4f4', borderRadius:'0px 8px 8px 0px', border:'none', color:'#505762', height:'40px' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
    										<i className="fas fa-sliders-h"></i>
											</button>
											<div className="dropdown-menu p-4" style={{ width:'100%', padding:'15px', boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.25)' }} >
												<div className="form-group">
													<label htmlFor="inputGroupSelect01">File type(s)</label>
													<select className="form-select" id="inputGroupSelect01" name="fileType">
														<option value="0" defaultValue={'true'}>Any type</option>
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
							<button className="btn btn-outline-secondary nav-link position-relative" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
								Alerts <i className="fas fa-bell" id="notifIcons"></i>
								{user.Notifications.length > 0 && (
									<span className="position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2"><span className="visually-hidden">unread messages</span></span>
								)}
							</button>
							<div className="dropdown-menu dropdown-menu-end p-1 text-muted" style={{ width: '300px', overflowY: 'scroll', maxHeight: '300px' }}>
								<h3 className="dropdown-header" style={{ fontSize: '18px' }}>Notifications - {user.Notifications.length}</h3>
								{user.Notifications.map(_ => (
									<div className="alert alert-primary alert-dismissible fade show" role="alert" key={_.id} style={{ padding: '13px' }}>
										<span style={{ fontSize: '15px' }}>{_.text} <a href="/resend">[Resend Email]</a></span>
										<button type="button" className="btn-close" aria-label="Close" onClick={(e)=> deleteNotification(e, _.id)}></button>
									</div>
								))}
								{user.Notifications.length == 0 && (
									<p className="mb-0">You currently have no notifications.</p>
								)}
							</div>
						</div>
					</li>
					<li className="nav-item">
						<a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							<Image src="/avatar" width={25} height={25} className="rounded-circle" alt="User avatar" />{user.name}
						</a>
						<div className="dropdown-menu dropdown-menu-end">
							<Link className="dropdown-item text-dark" href="/settings">Settings</Link>
							<Link className="dropdown-item text-dark" href="/files">My files</Link>
							<div className="dropdown-divider"></div>
							<a className="dropdown-item" href="#" onClick={() => signOut()} id="logout">Logout</a>
						</div>
					</li>
				</ul>
			</div>
		</nav>
	);
}
