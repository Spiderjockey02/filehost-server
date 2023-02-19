import type { fileItem } from '../utils/types';
import Link from 'next/link';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import type { User } from '../utils/types';
interface Props {
  files: fileItem[]
  dir: string
  user: User
}

export default function PhotoAlbum({ files, dir, user }: Props) {

	const myLoader = ({ src }: ImageLoaderProps) => `/thumbnail/${user.id}/${dir}/${src}`;
	return (
		<div className="row justify-content-between">
			{files.map(_ => (
				<div className="card col-sm-2 m-2 text-center" key={_.name} style={{ margin:'0px', padding: '0px' }}>
					<Link href={`/files${dir == '/' ? '/' : `/${dir}/`}${_.name}`} style={{ textDecoration: 'none' }}>
						<Image className="center" loader={myLoader} src={_.name}
							style={{ width:'auto', maxWidth:'200px', height:'auto', maxHeight:'275px' }}
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
	);
}
