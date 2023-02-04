import type { fileItem } from '../../utils/types';
import type { ImageLoaderProps } from 'next/image';
import VideoPlayer from './videoPlayer';
import MimeType from 'mime-types';
import Image from 'next/image';

interface Props {
  files: fileItem
}


export default function DisplayFile({ files }: Props) {
	const myLoader = ({ src, width, quality }: ImageLoaderProps) => {
		return `http://192.168.0.14:3000/api/uploads/${src}`;
	};

	return (
		<div>
			{ MimeType.lookup(files.name) != false ?
				(MimeType.lookup(files.name) as string)?.split('/')[0] == 'image' ?
  				<Image className="center" loader={myLoader} src={files.name}
  					alt={files.name} width={100} height={100} style={{ maxHeight: '200px' }}
  				/>
  				: <VideoPlayer files={files}/>
				: <p>Stuff</p>
			}
		</div>

	);
}
