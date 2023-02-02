import type { fileItem } from '../utils/types';
import type { ImageLoaderProps } from 'next/image';
import VideoPlayer from './videoPlayer';
import MimeType from 'mime-types';

interface Props {
  files: fileItem
}


export default function DisplayFile({ files }: Props) {
	const myLoader = ({ src }: ImageLoaderProps) => {
		return ;
	};

	return (
		<div>
			{(MimeType.lookup(files.name) as string).split('/')[0] == 'image' ?
				<img className="center" src={`http://192.168.0.14:3000/api/uploads/${files.name}`}
					alt={files.name}
				/>
				: <VideoPlayer files={files}/>
			}
		</div>

	);
}
