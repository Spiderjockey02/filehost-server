import Link from 'next/link';

export default function SideBar() {
	return (
		<nav id="sidebar">
			<Link href="/">
				<div className="sidebar-header">
					<h3><span className="side-text">File sharer</span></h3>
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
						<a type="button" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
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
				<label className="side-text">1GB of 5GB used</label>
				<div className="progress" style={{ width:'200px' }}>
					<div className="progress-bar bg-danger" role="progressbar" style={{ width:'10%' }} aria-valuenow={5} aria-valuemin={0} aria-valuemax={10}></div>
				</div>
				<a href="/user/trash" style={{ position:'fixed', bottom:'0', height:'4%', color:'black' }}><i className="fas fa-trash"></i> <span className="side-text">Deleted files</span></a>
			</div>
		</nav>
	);
}
