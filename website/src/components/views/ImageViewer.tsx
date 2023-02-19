import type { fileItem } from '../../utils/types';
import VideoPlayer from './videoPlayer';
import MimeType from 'mime-types';
import Image from 'next/image';
import type { User } from '../../utils/types';

interface Props {
  files: fileItem
  dir: string
  user: User
}


export default function DisplayFile({ files, dir, user }: Props) {

	return (
		<div style={{ display: 'flex', justifyContent: 'center' }}>
			{ MimeType.lookup(files.name) != false ?
				(MimeType.lookup(files.name) as string)?.split('/')[0] == 'image' ?
  				<Image className="center" src={`/content/${user.id}/${dir}`}
  					alt={files.name} width={1000} height={1000} style={{ maxHeight: '80vh', maxWidth: '80vw', width: 'auto', height: 'auto' }}
  				/>
  				: <VideoPlayer dir={dir} user={user}/>
				: <p>Stuff</p>
			}
		</div>
	);
}
