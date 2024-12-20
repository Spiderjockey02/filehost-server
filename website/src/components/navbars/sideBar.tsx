import Link from 'next/link';
import { formatBytes } from '../../utils/functions';
import config from '../../config';
import type { User } from '../../types/next-auth';
interface Props {
	user: User
}

export default function SideBar({ user }: Props) {
	const size = Number(user.totalStorageSize) ?? 0;

	function getColor(num: number) {
		if (num >= (0.9 * user.group.maxStorageSize)) {
			return 'bg-danger';
		} else if (num >= (0.5 * user.group.maxStorageSize)) {
			return 'bg-warning';
		} else {
			return 'bg-success';
		}
	}

	return (
		<nav id="sidebar">
			<Link href="/" className="sidebar-header side-text">
				<h3>{config.company.name}</h3>
			</Link>
			<ul className="list-unstyled components mobile-btn" style={{ verticalAlign:'center' }}>
				<li>
					<a className="btn sidebar-btn" data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample">
						<i className="fa-solid fa-bars"></i>
					</a>
				</li>
			</ul>
			<div className="offcanvas offcanvas-start" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel" style={{ maxWidth: '75%' }}>
				<div className="offcanvas-header">
					<h5 className="offcanvas-title" id="offcanvasExampleLabel">{config.company.name}</h5>
					<button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
				</div>
				<div className="offcanvas-body">
					<ul className="list-unstyled components">
						<li>
							<Link href="/files" className='btn sidebar-btn'>
								<i className="fas fa-folder" data-bs-toggle="tooltip" data-bs-placement="right" title="All files"></i>
								<span> All files</span>
							</Link>
						</li>
						<li>
							<Link href="/recent" className='btn sidebar-btn'>
								<i className="fas fa-clock" data-bs-toggle="tooltip" data-bs-placement="right" title="Recents"></i>
								<span> Recents</span>
							</Link>
						</li>
						<li>
							<Link href="/favourites" className='btn sidebar-btn'>
								<i className="fas fa-star" data-toggle="tooltip" data-placement="right" title="Favourites"></i>
								<span> Favourites</span>
							</Link>
						</li>
						<li style={{ position:'fixed', bottom:'0' }}>
							<div style={{ padding: '0 10px' }}>
								<label>{formatBytes(size)} of {formatBytes(user.group.maxStorageSize)} used</label>
								<div className="progress" style={{ width:'200px' }}>
									<div className={`progress-bar ${getColor(size)}`} role="progressbar" style={{ width:`${(size / user.group.maxStorageSize) * 100}%` }} aria-valuenow={size} aria-valuemin={0} aria-valuemax={user.group.maxStorageSize}></div>
								</div>
							</div>
							<Link href="/trash" className='btn sidebar-btn' style={{ marginTop: '0.5rem' }}>
								<i className="fas fa-trash"></i>
								<span> Bin</span>
							</Link>
						</li>
					</ul>
				</div>
			</div>
			<ul className="list-unstyled components">
				<li>
					<Link href="/files" className='btn sidebar-btn'>
						<i className="fas fa-folder" data-bs-toggle="tooltip" data-bs-placement="right" title="All files"></i>
						<span className="side-text"> All files</span>
					</Link>
				</li>
				<li>
					<Link href="/recent" className='btn sidebar-btn'>
						<i className="fas fa-clock" data-bs-toggle="tooltip" data-bs-placement="right" title="Recents"></i>
						<span className="side-text"> Recents</span>
					</Link>
				</li>
				<li>
					<Link href="/favourites" className='btn sidebar-btn'>
						<i className="fas fa-star" data-toggle="tooltip" data-placement="right" title="Favourites"></i>
						<span className="side-text"> Favourites</span>
					</Link>
				</li>
				<li className="bottom" style={{ position:'fixed', bottom:'0' }}>
					<div style={{ padding: '0 10px' }}>
						<label className="side-text">{formatBytes(size)} of {formatBytes(user.group.maxStorageSize)} used</label>
						<div className="progress side-text" style={{ width:'200px' }}>
							<div className={`progress-bar ${getColor(size)}`} role="progressbar" style={{ width:`${(size / user.group.maxStorageSize) * 100}%` }} aria-valuenow={size} aria-valuemin={0} aria-valuemax={user.group.maxStorageSize}></div>
						</div>
					</div>
					<Link href="/trash" className='btn sidebar-btn' style={{ marginTop: '0.5rem' }}>
						<i className="fas fa-trash"></i>
						<span className="side-text"> Bin</span>
					</Link>
				</li>
			</ul>
		</nav>
	);
}
