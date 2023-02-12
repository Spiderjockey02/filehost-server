import type { fileItem } from '../../utils/types';
import VideoPlayer from './videoPlayer';
import MimeType from 'mime-types';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import type { User } from '@prisma/client';

interface Props {
  files: fileItem
  dir: string
}


export default function DisplayFile({ files, dir }: Props) {
	// get session
	const { data: session, status } = useSession({ required: true });
	if (status == 'loading') return null;

	return (
		<div style={{ display: 'flex', justifyContent: 'center' }}>
			{ MimeType.lookup(files.name) != false ?
				(MimeType.lookup(files.name) as string)?.split('/')[0] == 'image' ?
  				<Image className="center" src={`/content/${(session?.user as User).id}/${dir}`}
  					alt={files.name} width={1000} height={1000} style={{ maxHeight: '80vh', maxWidth: '80vw', width: 'auto', height: 'auto' }}
  				/>
  				: <VideoPlayer dir={dir}/>
				: <p>Stuff</p>
			}
		</div>
	);
}
