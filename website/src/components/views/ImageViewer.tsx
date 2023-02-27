import type { fileItem } from '../../utils/types';
import VideoPlayer from './videoPlayer';
import MimeType from 'mime-types';
import Image from 'next/image';
import type { User } from '../../types/next-auth';
import axios from 'axios';
import { useState } from 'react';
import SuccessPopup from '../menus/Success-pop';
import ErrorPopup from '../menus/Error-pop';

interface Geo {
  name: string
  lat: number
  long: number
}

interface Objects {
  className: string
  probability: number
}

interface NSFW {
  className: string
  probability: number
}

interface Props {
  files: fileItem
  dir: string
  user: User
  analysed?: {
    landmark: string
    nsfw: string
    face: string
    objects: string
    geo: string
  }
}


export default function DisplayFile({ files, dir, user, analysed }: Props) {
	const nsfw: Array<NSFW> = JSON.parse(analysed?.nsfw ?? '{}');
	const objects: Array<Objects> = JSON.parse(analysed?.objects ?? '{}');
	const geo: Array<Geo> = JSON.parse(analysed?.geo ?? '{}');

	const [blur, setBlur] = useState(['Porn', 'Hentai', 'Sexy'].includes(nsfw[0]?.className) ? 10 : 0);
	const [successmsg, setSuccessmg] = useState(null);
	const [errormsg, setErrormg] = useState(null);
	console.log(analysed);
	async function BtnClick() {
		setErrormg(null);
		setSuccessmg(null);
		const { data } = await axios.get(`${window.origin}/api/analyse?path=${dir}`);
		if (data.success) setSuccessmg(data.success);
		setErrormg(data.error);
	}

	return (
		<>
			{successmsg != null && (
				<SuccessPopup text={successmsg} />
			)}
			{errormsg != null && (
				<ErrorPopup text={errormsg} />
			)}
			<div style={{ display: 'flex', justifyContent: 'center' }}>
				{ MimeType.lookup(files.name) != false ?
					(MimeType.lookup(files.name) as string)?.split('/')[0] == 'image' ?
						<div className="card" style={{ maxHeight: '80vh', maxWidth: '80vw', width: 'auto', height: 'auto' }}>
      				<Image className="center" src={`/content/${user.id}/${dir}`}
      					alt={files.name} width={1000} height={1000} style={{ maxHeight: '80vh', maxWidth: '80vw', width: 'auto', height: 'auto', filter: `blur(${blur}px)` }}
      				/>
							{['Porn', 'Hentai', 'Sexy'].includes(nsfw[0]?.className) && (
								<div className="card-img-overlay float-end">
									<button className="btn btn-secondary" onClick={() => setBlur(blur == 0 ? 10 : 0)}>Unblur</button>
								</div>
							)}
						</div>
  				: <VideoPlayer dir={dir} user={user}/>
					: <p>Stuff</p>
				}
			</div>
			<button className="btn btn-secondary" onClick={() => BtnClick()}>Analyse</button>
			<div className="container-fluid">
				<div className="row">
					<div className="col-sm-6">
						{Array.isArray(nsfw) && (
							<h3>NSFW: {['Porn', 'Hentai', 'Sexy'].includes(nsfw[0].className) ? 'true' : 'false'}</h3>
						)}
						{Array.isArray(objects) && objects.length > 0 && (
							<h3>Tags: {objects.map(i => i.className).join(', ')}</h3>
						)}
						{Array.isArray(geo) && geo.length > 0 && (
							<h3>Location: {geo[0].lat}, {geo[0].long} ({geo[0].name})</h3>
						)}
					</div>
					<div className="col-sm-6">
						{Array.isArray(geo) && geo.length > 0 && (
							<div style={{ width: '100%' }}>
								<iframe width="100%" height="600" src={`https://maps.google.com/maps?width=100%25&amp;height=601&amp;hl=en&amp;q=${geo[0].lat},${geo[0].long}&amp;t=k&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed`}>
									<a href="https://www.maps.ie/distance-area-calculator.html">area maps</a>
								</iframe>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
