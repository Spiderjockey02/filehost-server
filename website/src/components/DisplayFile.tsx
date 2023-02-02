import type { fileItem } from '../utils/types';
import type { ImageLoaderProps } from 'next/image';
import VideoPlayer from './videoPlayer';
interface Props {
  files: fileItem
}


export default function DisplayFile({ files }: Props) {
	const myLoader = ({ src }: ImageLoaderProps) => {
		return ;
	};

	return (
		<div>
			{files.extension === '.jpg' ?
				<img className="center" src={`http://192.168.0.14:3000/api/thumbnail/${files.name}`}
					alt={files.name}
				/>
				: <VideoPlayer files={files}/>
			}
		</div>

	);
}
