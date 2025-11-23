import { faChevronDown, faChevronUp, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import Image, { ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import Card from '../UI/Card';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import { UserHistoryWithFile } from '@/types/database';

export default function RecentNavbar() {
	const [show, setShow] = useState(false);
	const myLoader = ({ src }: ImageLoaderProps) => `/thumbnail/${src}`;

	const { data, isLoading } = useQuery({
		queryKey: ['recentViewed'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/session/recently-viewed?sortBy=viewedAt&sortOrder=desc', { signal });
			if (!res.ok) throw new Error(`Failed to fetch recent activity: ${res.statusText}`);

			const d = await res.json();
			return d as { files: UserHistoryWithFile[] };
		},
		...queryOptions,
	});

	if (isLoading || data == undefined) return null;
	return (
		<div className="recent-tab pb-1">
			<button className="btn btn-outline-secondary d-flex align-items-center" onClick={() => setShow(!show)}>
				<FontAwesomeIcon icon={faClockRotateLeft} />
				<span>Recently accessed files</span>
				<FontAwesomeIcon icon={show ? faChevronUp : faChevronDown} />
			</button>
			{show && (
				<Card className="border-0" style={{ height: '285px', margin: '0px' }}>
					<div className="d-flex flex-wrap gap-2 overflow-hidden">
						{data?.files.map(({ file }) => (
							<Link href={`/files${file.path}`} key={file.id} className="btn p-0 pt-1" style={{ width: '150px' }}>
								<Card className='recentIcon'>
									<div className="image-container">
										<Image className="card-img-top" loader={myLoader} src={`${file.userId}${file.path}`} alt={`Thumbnail for ${file.name}`} width={200} height={225} style={{ width: '100%', objectFit: 'cover' }} />
									</div>
									<Card.Body className='border-top p-1'>
										<p className="text-truncate text-center">
											{file.name}
										</p>
									</Card.Body>
								</Card>
							</Link>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
