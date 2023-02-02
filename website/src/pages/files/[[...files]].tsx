import FileNavBar from '../../components/file-navBar';
import SideBar from '../../components/sideBar';
import Directory from '../../components/directory';
import PhotoAlbum from '../../components/photoAlbum';
import DisplayFile from '../../components/DisplayFile';
import directoryTree from '../../utils/directory';
import type { fileItem } from '../../utils/types';
import type { GetServerSidePropsContext } from 'next';
import { ChangeEvent } from 'react';
import Link from 'next/link';
import fs from 'fs';
import { getServerSession } from 'next-auth/next';
import { AuthOptions } from '../api/auth/[...nextauth]';
import {findUser} from '../../db/prisma';

interface Props {
	dir: fileItem | null
	path: string
}

export default function Files({ dir, path = '/' }: Props) {

	const onFileUploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const fileInput = e.target;

		if (!fileInput.files) return alert('No file was chosen');

		if (!fileInput.files || fileInput.files.length === 0) return alert('Files list is empty');

		const selectedFile = fileInput.files[0];

		/** Reset file input */
		e.currentTarget.type = 'text';
		e.currentTarget.type = 'file';

		try {
			const formData = new FormData();
			formData.append('media', selectedFile);

			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});

			const { data, error }: {
				data: {
					url: string | string[];
				} | null;
				error: string | null;
			} = await res.json();

			if (error || !data) return alert(error || 'Sorry! something went wrong.');
			console.log('File was uploaded successfylly:', data);
		} catch (error) {
			console.error(error);
			alert('Sorry! something went wrong.');
		}
	};

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
													<Link className="directoyLink" href={"/files"} style={{ color:'grey' }}>Home</Link>
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
								{(dir?.children?.length ?? 0) >= 1 &&
									<div className="btn-group" role="group" style={{ float:'right' }}>
										<button type="button" className="btn btn-outline-secondary" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-offset="0,10">New <i className="fas fa-plus"></i></button>
										<div className="dropdown-menu dropdown-menu-right">
											<label className="dropdown-item" id="fileHover">
														File upload<input type="file" hidden name="sampleFile" className="upload-input" onChange={onFileUploadChange} />
											</label>
											<input type="hidden" value="test" name="path" />
											<label className="dropdown-item" id="fileHover">
													Folder upload<input type="file" hidden name="sampleFile" className="upload-input" />
											</label>
											<div className="dropdown-divider"></div>
											<a className="dropdown-item" href="#">Create folder</a>
											<button type="submit" style={{ display:'none' }} id="imagefile"></button>
										</div>
										<button type="button" className="btn btn-outline-secondary">New <i className="fas fa-plus"></i></button>
									</div>
								}
							</div>
						</div>
						{dir == null ?
							<p>This folder is empty</p>
							: (dir.children?.length >= 1) ?
								dir.children.filter(item => ['.png', '.jpg', '.jpeg', '.ico', '.mp4', '.mov'].includes(item.extension)).length / dir.children.length >= 0.60 ?
									<PhotoAlbum files={dir.children.filter(file => file.type == 'file').slice(0, 50)} dir={path} /> :
									<Directory files={dir} dir={path} />
								: <DisplayFile files={dir}/>
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
	const session = await getServerSession(context.req,context.res,AuthOptions)
	const user = await findUser({email: session?.user?.email})
	// Validate path
	const basedPath = `${process.cwd()}/uploads/${user?.id}`;
	if (fs.existsSync(`${basedPath}/${path.join('/')}`)) {
		const files = directoryTree(`${basedPath}/${path.join('/')}`);
		return { props: { dir: files, path: path.join('/') } };
	} else {
		return { props: { dir: null, path: path.join('/') } };
	}
}
