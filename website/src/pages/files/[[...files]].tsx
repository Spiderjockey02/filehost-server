import FileNavBar from '../../components/file-navBar';
import SideBar from '../../components/sideBar';
import Directory from '../../components/directory';
import PhotoAlbum from '../../components/photoAlbum';
import directoryTree from '../../utils/directory';
import type { fileItem } from '../../utils/types';
import type { GetServerSidePropsContext } from 'next';
import Link from 'next/link';
import fs from 'fs';

interface Props {
	dir: fileItem | null
	path: string
}

export default function Files({ dir, path = '/' }: Props) {
	return (
		<>
			<div className="wrapper" style={{ height:'100vh' }}>
				<SideBar />
				<div className="container-fluid">
					<FileNavBar />
					<div className="container-fluid">
						<div className="row">
							<div className="col-md-10">
								<nav style={{ fontSize:'18.72px' }} aria-label="breadcrumb">
					        <ol className="breadcrumb" style={{ backgroundColor:'white' }}>
					          <li className="breadcrumb-item">
											{(path == '/') ?
												<b style={{ color:'black' }}>Home</b>
												: <b>
													<Link className="directoyLink" href="/files" style={{ color:'grey' }}>Home</Link>
												</b>
											}
					          </li>
										{path.split('/').map(name => (
											 <li className="breadcrumb-item" key={name}>
											 {(name !== path.split('/').pop() ?
											  	<b>
														<Link className="directoyLink" href={`/files/${path.split('/').slice(0, path.split('/').indexOf(name) + 1).join('/')}`} style={{ color:'grey' }}>{name}</Link>
													</b>
													: <b style={{ color:'black' }}>{name}</b>
										 		)}
											 </li>
										))}
					        </ol>
	      				</nav>
							</div>
							<div className="col-md-2">
								<div className="btn-group" role="group" style={{ float:'right' }}>
								  <button type="button" className="btn btn-outline-secondary" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-offset="0,10">New <i className="fas fa-plus"></i></button>
									<div className="dropdown-menu dropdown-menu-right">
										<form action="/files/upload" method="post" encType="multipart/form-data" id="uploadForm">
											<label className="dropdown-item" id="fileHover">
													File upload<input type="file" hidden name="sampleFile" className="upload-input" />
											</label>
											<input type="hidden" value="test" name="path" />
											<label className="dropdown-item" id="fileHover">
												Folder upload<input type="file" hidden name="sampleFile" className="upload-input" />
											</label>
											<div className="dropdown-divider"></div>
											<a className="dropdown-item" href="#">Create folder</a>
											<button type="submit" style={{ display:'none' }} id="imagefile"></button>
										</form>
									</div>
									<button type="button" className="btn btn-outline-secondary">New <i className="fas fa-plus"></i></button>
								</div>
							</div>
						</div>
						{dir == null ?
							<p>This folder is empty</p>
							: dir.children.filter(item => ['.png', '.jpg', '.jpeg', '.ico', '.mp4', '.mov'].includes(item.extension)).length / dir.children.length >= 0.60 ?
								<PhotoAlbum files={dir.children.filter(file => file.type == 'file').slice(0, 50)} /> :
								<Directory files={dir} dir={path} />
						}
					</div>
				</div>
			</div>
		</>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Get path
	const path = [context.params?.files].flat();

	// Validate path
	const basedPath = 'C:\\Users\\benja\\OneDrive\\Pictures\\';
	if (fs.existsSync(`${basedPath}\\${path.join('\\')}`)) {
		const files = directoryTree(`${basedPath}${path.join('\\')}`);
		return { props: { dir: files, path: path.join('/') } };
	} else {
		return { props: { dir: null, path: path.join('/') } };
	}
}
