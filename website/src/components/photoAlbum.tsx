import type { fileItem } from '../utils/types';
import Link from 'next/link';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import type { User } from '../types/next-auth';
import { useState } from 'react';
interface Props {
  files: fileItem[]
  dir: string
  user: User
}

export default function PhotoAlbum({ files, dir, user }: Props) {
	const [page, setPage] = useState(0);
	const pageCount = 10;

	const myLoader = ({ src }: ImageLoaderProps) => `/thumbnail/${user.id}/${dir}/${src}`;
	return (
		<>
			<div className="row justify-content-between">
				{files.slice(page * pageCount, (page + 1) * pageCount).map(_ => (
					<div className="card col-sm-2 m-2 text-center" key={_.name} style={{ margin:'0px', padding: '0px' }}>
						<Link href={`/files${dir == '/' ? '/' : `/${dir}/`}${_.name}`} style={{ textDecoration: 'none' }}>
							<Image className="center" loader={myLoader} src={_.name}
								style={{ width:'auto', maxWidth:'200px', height:'auto', maxHeight:'275px', minWidth:200 }}
								alt={_.name} width="200" height="275"
							/>
							<div className="card-body">
								<h5 className="card-title text-truncate">{_.name}</h5>
								<p>{new Date(_.modified).toDateString()}</p>
							</div>
						</Link>
					</div>
				))}
			</div>
			<div className="d-flex justify-content-center">
				<nav aria-label="Page navigation example">
					<ul className="pagination">
						<li className="page-item">
							<a className="page-link" href="#" aria-label="Previous" onClick={() => setPage(page - 1 < 0 ? 0 : page - 1)}>
								<span aria-hidden="true">&laquo;</span>
								<span className="sr-only">Previous</span>
							</a>
						</li>
						<li className="page-item">
							<a className="page-link" href="#"onClick={() => setPage(1)} >1</a>
						</li>
						<li className="page-item"><p className="page-link">{page}</p></li>
						<li className="page-item">
							<a className="page-link" href="#" onClick={() => setPage(Math.floor(files.length / pageCount))} >{Math.floor(files.length / 10)}</a>
						</li>
						<li className="page-item">
							<a className="page-link" href="#" aria-label="Next" onClick={() => setPage(page + 1 > Math.floor(files.length / pageCount) ? Math.floor(files.length / pageCount) : page + 1)}>
								<span aria-hidden="true">&raquo;</span>
								<span className="sr-only">Next</span>
							</a>
						</li>
					</ul>
				</nav>
			</div>
		</>
	);
}
