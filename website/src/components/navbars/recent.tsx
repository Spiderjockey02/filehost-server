import type { Recent } from '@prisma/client';
import Image from 'next/image';
import type { User } from '@prisma/client';
import Link from 'next/link';
interface Props {
	files: Array<Recent>
	user: User
}

export default function Recent({ files, user }: Props) {
	return (
		<>
			<a type="button" data-bs-toggle="collapse" data-bs-target="#recentCollapse" aria-expanded="true" aria-controls="collapseExample">
        Recent files
				<svg height="16" viewBox="0 0 16 16" width="16" focusable="false" aria-hidden="true" role="presentation" data-toggle="tooltip" data-placement="top">
					<path className="fill-color" d="M3.46 6.727a.572.572 0 0 1 .81-.81L8 9.648l3.73-3.73a.572.572 0 0 1 .81.81L8.495 10.77a.7.7 0 0 1-.99 0L3.46 6.727zm9.49 6.223a7 7 0 1 0-9.9-9.9 7 7 0 0 0 9.9 9.9z" fill="#4e4e4e" fill-rule="evenodd"></path>
				</svg>
			</a>
			<div className="collapse show" id="recentCollapse">
				<div className="d-flex justify-content-start" style={{ overflowX: 'hidden' }}>
					{files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(f => (
						<Link href={`/files/${f.location}`} className="boo" key={f.location}>
							<div className="card recentIcon">
								<div className="image-container">
									<Image className="card-img-top lozad" src={`/thumbnail/${user.id}/${f.location}`} alt="Recent file accessed"
										style={{ width:'auto', maxWidth:'200px', height:'auto', maxHeight:'200px' }} width="200" height="200" />
								</div>
								<div className="card-body" style={{ borderTop: '1px solid #e3e3e3', padding:'0px 10px' }}>
									<p className="text-truncate" data-toggle="tooltip" data-placement="top" title="<%= file.name%>">{f.location.split('/').at(-1)}</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			</div>
		</>
	);
}
