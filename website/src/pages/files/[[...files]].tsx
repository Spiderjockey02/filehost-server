import FileNavBar from '../../components/navbars/file-navBar';
import SideBar from '../../components/navbars/sideBar';
import Directory from '../../components/directory';
import PhotoAlbum from '../../components/photoAlbum';
import ImageViewer from '../../components/views/ImageViewer';
import SimpleProgressBar from '../../components/SimpleProgress';
import RecentTab from '../../components/navbars/recent';
import type { fileItem } from '../../utils/types';
import type { GetServerSidePropsContext } from 'next';
import { ChangeEvent, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { AuthOption } from '../api/auth/[...nextauth]';
import { findUser } from '../../db/User';
import axios, { AxiosRequestConfig } from 'axios';
import { useRouter } from 'next/router';
import config from '../../config';
interface Props {
	dir: fileItem | null
	path: string
}

type viewTypeTypes = 'List' | 'Tiles';

export default function Files({ dir, path = '/' }: Props) {
	const { data: session, status } = useSession({ required: true });
	const router = useRouter();

	const [progress, setProgress] = useState(0);
	const [remaining, setRemaining] = useState(0);
	const [viewType, setviewType] = useState<viewTypeTypes>('List');

	if (status == 'loading') return null;
	const onFileUploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const fileInput = e.target;
		if (!fileInput.files) return alert('No file was chosen');
		if (!fileInput.files || fileInput.files.length === 0) return alert('Files list is empty');


		const validFiles: File[] = [];
		for (let i = 0; i < fileInput.files.length; i++) {
			const file = fileInput.files[i];
			validFiles.push(file);
		}

		/** Reset file input */
		e.currentTarget.type = 'text';
		e.currentTarget.type = 'file';

		try {
			const startAt = Date.now();
			const formData = new FormData();
			validFiles.forEach((file) => formData.append('media', file));
			const options: AxiosRequestConfig = {
				headers: { 'Content-Type': 'multipart/form-data' },
				onUploadProgress: (progressEvent) => {
					const { loaded, total } = progressEvent;

					// Calculate the progress percentage
					const percentage = (loaded * 100) / (total ?? 0);
					setProgress(+percentage.toFixed(2));

					// Calculate the progress duration
					const timeElapsed = Date.now() - startAt;
					const uploadSpeed = loaded / timeElapsed;
					const duration = ((total ?? 0) - loaded) / uploadSpeed;
					setRemaining(duration);
				},
			};

			await axios.post(`/api/files/upload/${session?.user.id}`, formData, options);
			router.reload();
			setProgress(0);
			setRemaining(0);
		} catch (error) {
			console.error(error);
			alert('Sorry! something went wrong.');
		}
	};

	return (
		<>
			<div className="wrapper" style={{ height:'100vh' }}>
				<SideBar size={dir?.size ?? 0} user={session.user}/>
				<div className="container-fluid" style={{ overflowY: 'scroll' }}>
					<FileNavBar user={session.user}/>
					<div className="container-fluid">
						<div className="row">
							<div className="col-md-10">
								<nav style={{ fontSize:'18.72px' }} aria-label="breadcrumb">
					        <ol className="breadcrumb" style={{ backgroundColor:'white' }}>
					          <li className="breadcrumb-item">
											{(path.length <= 1) ?
												<b style={{ color:'black' }}>Home</b>
												: <b>
													<Link className="directoyLink" href={'/files'} style={{ color:'grey' }}>Home</Link>
												</b>
											}
					          </li>
										{path.split('/').length >= 1 ?
										 path.split('/').map(name => (
											 <li className="breadcrumb-item" key={name}>
											 {(name !== path.split('/').pop() ?
											  	<b>
															<Link className="directoyLink" href={`/files/${path.split('/').slice(0, path.split('/').indexOf(name) + 1).join('/')}`} style={{ color:'grey' }}>{name}</Link>
														</b>
														: <b className="d-inline-block text-truncate" style={{ color:'black', maxWidth:'100vw' }}>{name}</b>
										 		)}
											 </li>
											)) : <> </>}
					        </ol>
	      				</nav>
							</div>
							<div className="col-md-2">
								{(dir?.children?.length ?? 0) >= 1 &&
									<div className="btn-group" role="group" style={{ float: 'right' }}>
										<button type="button" className="btn btn-outline-secondary" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-offset="0,10">New <i className="fas fa-plus"></i></button>
										<div className="dropdown-menu dropdown-menu-right">
											<label className="dropdown-item" id="fileHover">
												File upload<input type="file" hidden name="sampleFile" className="upload-input" onChange={onFileUploadChange} multiple/>
											</label>
											<input type="hidden" value="test" name="path" />
											<label className="dropdown-item" id="fileHover">
												Folder upload<input type="file" hidden name="sampleFile" className="upload-input" />
											</label>
											<div className="dropdown-divider"></div>
											<a className="dropdown-item" href="#">Create folder</a>
											<button type="submit" style={{ display:'none' }} id="imagefile"></button>
										</div>
										<button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
    										Change view
										</button>
										<ul className="dropdown-menu">
											<li><a onClick={() => setviewType('Tiles')} className="dropdown-item" href="#">Tiles</a></li>
											<li><a onClick={() => setviewType('List')} className="dropdown-item" href="#">List</a></li>
										</ul>
									</div>
								}
							</div>
						</div>
						{(path.length <= 1 && session.user.recentFiles.length >= 1) &&
						<RecentTab files={session?.user.recentFiles} user={session.user}/>
						}
						{dir == null ?
							<p>This folder is empty</p>
							: (dir.children?.length >= 1) ?
								viewType == 'Tiles' ?
									<PhotoAlbum files={dir.children.slice(0, 50)} dir={path} user={session.user} /> :
									<Directory files={dir} dir={path} />
								: <ImageViewer files={dir} dir={path} user={session.user}/>
						}
						<SimpleProgressBar progress={progress} remaining={remaining} />
					</div>
				</div>
			</div>
		</>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Get path
	const path = [context.params?.files].flat();
	const session = await getServerSession(context.req, context.res, AuthOption);
	const user = await findUser({ email: session?.user?.email as string });
	// Validate path
	try {
		const { data } = await axios.get(`${config.backendURL}/api/fetch/files/${user?.id}${path ? `/${path.join('/')}` : ''}`);
		return { props: { dir: data.files, path: path.join('/') } };
	} catch (err) {
		return { props: { dir: null, path: '/' } };
	}
}
