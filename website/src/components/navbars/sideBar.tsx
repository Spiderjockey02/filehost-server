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
		if (num >= 4 * 1024 * 1024 * 1024) {
			return 'bg-danger';
		} else if (num >= 2.5 * 1024 * 1024 * 1024) {
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
					<a className="btn" data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample">
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
					<ul className="list-unstyled components" style={{ verticalAlign:'center' }}>
						<li>
							<Link href="/files"><i className="fas fa-folder" data-bs-toggle="tooltip" data-bs-placement="right" title="All files"></i> All files</Link>
						</li>
						<li>
							<Link href="/recent"><i className="fas fa-clock" data-bs-toggle="tooltip" data-bs-placement="right" title="Recents"></i>Recents</Link>
						</li>
						<li>
							<span className="smallFav">
								<Link type="button" href="/favourites">
									<i className="fas fa-star" data-toggle="tooltip" data-placement="right" title="Favourites"></i>Favourites
								</Link>
							</span>
							<a type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
								<i className="fas fa-star"></i>Favourites <i className="fas fa-sort-up" style={{ verticalAlign:'center', float:'right' }}></i>
							</a>
							<div className="collapse" id="collapseExample" style={{ maxWidth: '200px' }}>
								{user.recentFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((_) => (
									<Link key={_.location} className="card-text text-truncate" style={{ color:'black', fontSize:'15px', textDecoration: 'none' }} href={`/files/${_.location}`}>
										<i className="far fa-file"></i> <b>{_.location.split('/').at(-1)}</b>
									</Link>
								))}
							</div>
						</li>
					</ul>
					<div className="p-2 bottom side-text" style={{ position:'fixed', bottom:'0', height:'11%' }}>
						<label className="side-text">{formatBytes(Number(user.totalStorageSize))} of {formatBytes(Number(user.group?.maxStorageSize ?? 0))} used</label>
						<div className="progress" style={{ width:'200px' }}>
							<div className={`progress-bar ${getColor(Number(user.totalStorageSize))}`} role="progressbar" style={{ width:`${(Number(user.totalStorageSize) / (5 * 1024 * 1024 * 1024)) * 100}%` }} aria-valuenow={Number(user.totalStorageSize)} aria-valuemin={0} aria-valuemax={5 * 1024 * 1024 * 1024}></div>
						</div>
						<Link href="/trash" style={{ position:'fixed', bottom:'0', height:'4%', color:'black', textDecoration: 'none' }}>
							<i className="fas fa-trash"></i> <span className="side-text">Deleted files</span>
						</Link>
					</div>
				</div>
			</div>


			<ul className="list-unstyled components" style={{ verticalAlign:'center' }}>
				<li>
					<Link href="/files"><i className="fas fa-folder" data-bs-toggle="tooltip" data-bs-placement="right" title="All files"></i><span className="side-text"> All files</span></Link>
				</li>
				<li>
					<Link href="/recent"><i className="fas fa-clock" data-bs-toggle="tooltip" data-bs-placement="right" title="Recents"></i><span className="side-text"> Recents</span></Link>
				</li>
				<li>
					<span className="smallFav">
						<Link type="button" href="/favourites">
							<i className="fas fa-star" data-toggle="tooltip" data-placement="right" title="Favourites"></i>
						</Link>
					</span>
					<span className="side-text">
						<a type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
							<i className="fas fa-star"></i><span className="side-text">Favourites <i className="fas fa-sort-up" style={{ verticalAlign:'center', float:'right' }}></i></span>
						</a>
						<div className="collapse" id="collapseExample" style={{ maxWidth: '200px' }}>
							{user.recentFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((_) => (
								<Link key={_.location} className="card-text text-truncate" style={{ color:'black', fontSize:'15px', textDecoration: 'none' }} href={`/files/${_.location}`}>
									<i className="far fa-file"></i> <b>{_.location.split('/').at(-1)}</b>
								</Link>
							))}
						</div>
					</span>
				</li>
			</ul>
			<div className="p-2 bottom side-text" style={{ position:'fixed', bottom:'0', height:'11%' }}>
				<label className="side-text">{formatBytes(size)} of {formatBytes(size)} used</label>
				<div className="progress" style={{ width:'200px' }}>
					<div className={`progress-bar ${getColor(size)}`} role="progressbar" style={{ width:`${(size / (5 * 1024 * 1024 * 1024)) * 100}%` }} aria-valuenow={size} aria-valuemin={0} aria-valuemax={5 * 1024 * 1024 * 1024}></div>
				</div>
				<Link href="/trash" style={{ position:'fixed', bottom:'0', height:'4%', color:'black', textDecoration: 'none' }}>
					<i className="fas fa-trash"></i> <span className="side-text">Deleted files</span>
				</Link>
			</div>
		</nav>
	);
}
