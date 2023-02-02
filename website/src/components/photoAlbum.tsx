import type { fileItem } from '../utils/types';
import Link from 'next/link';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';

interface Props {
  files: fileItem[]
  dir: string
}

export default function PhotoAlbum({ files, dir }: Props) {

	const myLoader = ({ src }: ImageLoaderProps) => {
		return `http://192.168.0.14:3000/api/thumbnail/${src}`;
	};

	return (
		<div className="row justify-content-between">
			{files.map(_ => (
				<div className="card col-sm-2 m-2" style={{ marginBottom: '10px' }} key={_.name}>
					<Link href={`/files${dir == '/' ? '/' : `/${dir}/`}${_.name}`}>
						<Image className="center" loader={myLoader} src={_.name}
							style={{ width:'auto', maxWidth:'200px', height:'auto', maxHeight:'275px' }}
							alt={_.name} width="200" height="230"
						/>
						<div className="card-body">
							<h5 className="card-title">{_.name}</h5>
						</div>
					</Link>
				</div>
			))}
		</div>
	);
}
