import FileNavBar from '../components/navbars/file-navBar';
import SideBar from '../components/navbars/sideBar';
import { useSession } from 'next-auth/react';
import type { RecentFiles } from '../types/next-auth';
import Link from 'next/link';

export default function Recent() {
	const { data: session, status } = useSession({ required: true });
	if (status == 'loading') return null;
	const files: Array<RecentFiles> = session.user.recentFiles;

	return (
		<>
			<div className="wrapper" style={{ height:'100vh' }}>
				<SideBar user={session.user}/>
				<div className="container-fluid" style={{ overflowY: 'scroll' }}>
					<FileNavBar user={session.user}/>
					<div className="container-fluid">
						<div className="row">
							<div className="col-md-10">
								<nav style={{ fontSize:'18.72px' }} aria-label="breadcrumb">
									<ol className="breadcrumb" style={{ backgroundColor:'white' }}>
										<li className="breadcrumb-item">
											<b style={{ color:'black' }}>Recent</b>
										</li>
									</ol>
								</nav>
							</div>
							<div className="col-md-2">
							</div>
						</div>
						<table className="table" id="myTable">
							<thead>
								<tr>
									<th id="Name" className="th-header" scope="col">
                    Name
									</th>
									<th id="Date modified" className="th-header" style={{ borderTopRightRadius: '5px' }} scope="col">
                    Accessed on
									</th>
								</tr>
							</thead>
							<tbody>
								{files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(_ => (
									<tr key={_.location}>
										<th scope="row" className="text-truncate" style={{ maxWidth: 'calc( 70 * 1vw )' }}>
											<Link href={`/files/${_.location}`}>{_.location}</Link>
										</th>
										<td>{new Date(_.createdAt).toLocaleString('en-US')}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</>
	);
}
