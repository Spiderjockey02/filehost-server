import { faBars, faClock, faFolder, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FileSideBarProps } from '@/types/Components/Navbars';
import { formatBytes, getStatusColor } from '@/utils/functions';
import config from '@/config';
import Link from 'next/link';

export default function FileSideBar({ user, activeTab }: FileSideBarProps) {
	const size = user.totalStorageSize;

	return (
		<nav id="sidebar">
			<Link href="/" className="sidebar-header side-text">
				<h3>{config.company.name}</h3>
			</Link>
			<ul className="list-unstyled components mobile-btn" style={{ verticalAlign:'center' }}>
				<li>
					<a className="btn sidebar-btn" data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample">
						<FontAwesomeIcon icon={faBars} />
					</a>
				</li>
			</ul>
			<div className="offcanvas offcanvas-start" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel" style={{ maxWidth: '75%' }}>
				<div className="offcanvas-header">
					<Link href="/" className='btn'>
						<h4 className="offcanvas-title" id="offcanvasLabel">{config.company.name}</h4>
					</Link>
					<button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
				</div>
				<div className="offcanvas-body" style={{ padding: '0' }}>
					<ul className="list-unstyled components">
						<li>
							<Link href="/files" className={`btn sidebar-btn ${activeTab === 'files' ? 'active' : ''}`}>
								<FontAwesomeIcon icon={faFolder} />
								<span> All files</span>
							</Link>
						</li>
						<li>
							<Link href="/recent" className={`btn sidebar-btn ${activeTab === 'recent' ? 'active' : ''}`}>
								<FontAwesomeIcon icon={faClock} />
								<span> Recents</span>
							</Link>
						</li>
						<li className="bottom" style={{ position:'absolute', bottom:'0', width: '100%' }}>
							<div className='d-flex flex-column align-items-center'>
								<label>{formatBytes(size)} of {formatBytes(user.plan.maxStorageSize)} used</label>
								<div className="progress" style={{ width:'200px' }}>
									<div className={`progress-bar ${getStatusColor(size, user.plan.maxStorageSize)}`} role="progressbar" style={{ width:`${(size / (user.plan.maxStorageSize ?? 1)) * 100}%` }} aria-valuenow={size} aria-valuemin={0} aria-valuemax={user.plan.maxStorageSize}></div>
								</div>
							</div>
							<Link href="/trash" className={`btn sidebar-btn ${activeTab === 'bin' ? 'active' : ''}`} style={{ marginTop: '0.5rem' }}>
								<FontAwesomeIcon icon={faTrash} />
								<span> Bin</span>
							</Link>
						</li>
					</ul>
				</div>
			</div>
			<ul className="list-unstyled components">
				<li>
					<Link href="/files" className={`btn sidebar-btn ${activeTab === 'files' ? 'active' : ''}`}>
						<span data-bs-toggle="tooltip" data-bs-placement="right" title="All files"><FontAwesomeIcon icon={faFolder} /></span>
						<span className="side-text"> All files</span>
					</Link>
				</li>
				<li>
					<Link href="/recent" className={`btn sidebar-btn ${activeTab === 'recent' ? 'active' : ''}`}>
						<span data-bs-toggle="tooltip" data-bs-placement="right" title="Recents"><FontAwesomeIcon icon={faClock} /></span>
						<span className="side-text"> Recents</span>
					</Link>
				</li>
				<li className="bottom" style={{ position:'absolute', bottom:'0', width: '100%' }}>
					<div className='d-flex flex-column align-items-center'>
						<label className="side-text">{formatBytes(size)} of {formatBytes(user.plan.maxStorageSize)} used</label>
						<div className="progress side-text" style={{ width:'200px' }}>
							<div className={`progress-bar ${getStatusColor(size, user.plan.maxStorageSize)}`} role="progressbar" style={{ width:`${(size / user.plan.maxStorageSize) * 100}%` }} aria-valuenow={size} aria-valuemin={0} aria-valuemax={user.plan.maxStorageSize}></div>
						</div>
					</div>
					<Link href="/trash" className={`btn sidebar-btn ${activeTab === 'bin' ? 'active' : ''}`} style={{ marginTop: '0.5rem' }}>
						<span data-bs-toggle="tooltip" data-bs-placement="right" title="Bin"><FontAwesomeIcon icon={faTrash} /></span>
						<span className="side-text"> Bin</span>
					</Link>
				</li>
			</ul>
		</nav>
	);
}
