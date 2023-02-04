import Link from 'next/link';
import { formatBytes } from '../../utils/functions';
import config from '../../config';
interface Props {
	size: number
}

export default function SideBar({ size }: Props) {

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
			<Link href="/">
				<div className="sidebar-header">
					<h3><span className="side-text">{config.company.name}</span></h3>
				</div>
			</Link>
			<ul className="list-unstyled components" style={{ verticalAlign:'center' }}>
				<li>
					<Link href="/files"><i className="fas fa-folder" data-toggle="tooltip" data-placement="right" title="All files"></i><span className="side-text"> All files</span></Link>
				</li>
				<li>
					<Link href="/recent"><i className="fas fa-clock" data-toggle="tooltip" data-placement="right" title="Recents"></i><span className="side-text"> Recents</span></Link>
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
						<div className="collapse" id="collapseExample">
							<div style={{ maxWidth:'100%' }}>
								<Link className="card-text text-truncate" style={{ color:'black', fontSize:'15px' }} href="/files" data-toggle="tooltip" data-placement="right" title="fileNAME">
									<i className="far fa-file"></i>
									<b>FILENAME</b>
								</Link>
							</div>
						</div>
					</span>
				</li>
			</ul>
			<div className="p-2 bottom" style={{ position:'fixed', bottom:'0', height:'11%' }}>
				<label className="side-text">{formatBytes(size)} of 5GB used</label>
				<div className="progress" style={{ width:'200px' }}>
					<div className={`progress-bar ${getColor(size)}`} role="progressbar" style={{ width:`${(size / (5 * 1024 * 1024 * 1024)) * 100}%` }} aria-valuenow={size} aria-valuemin={0} aria-valuemax={5 * 1024 * 1024 * 1024}></div>
				</div>
				<Link href="/user/trash" style={{ position:'fixed', bottom:'0', height:'4%', color:'black', textDecoration: 'none' }}>
					<i className="fas fa-trash"></i> <span className="side-text">Deleted files</span>
				</Link>
			</div>
		</nav>
	);
}
