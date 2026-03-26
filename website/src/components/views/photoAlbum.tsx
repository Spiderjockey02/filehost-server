import type { DirectoryProps } from '@/types/Components/Views';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { File } from '@/types/generated/browser';
import type { ImageLoaderProps } from 'next/image';
import MediaLightBox from './MediaLightbox';
import Image from 'next/image';
import Link from 'next/link';
const fileTypes = {
	'DIRECTORY': 0,
	'FILE': 1,
};

export default function PhotoAlbum({ folder }: DirectoryProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [itemsToShow, setItemsToShow] = useState(40);
	const observerRef = useRef<HTMLDivElement | null>(null);
	const myLoader = ({ src }: ImageLoaderProps) => `/thumbnail/${folder.userId}${encodeURI(src)}`;

	const visibleFiles = useMemo(() => folder.children.sort((a, b) => fileTypes[a.type] - fileTypes[b.type]).slice(0, itemsToShow), [folder.children, itemsToShow]);
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && itemsToShow < folder.children.length) setItemsToShow((prev) => Math.min(prev + 40, folder.children.length));
			},
			{ rootMargin: '200px' },
		);

		if (observerRef.current) observer.observe(observerRef.current);
		return () => {
			if (observerRef.current) observer.unobserve(observerRef.current);
		};
	}, [itemsToShow, folder.children.length]);


	return (
		<>
			<div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, max-content))', gap: '5px', justifyContent: 'start' }}>
				{visibleFiles.map((file) => (
					<div key={file.name} className="text-center rounded position-relative file-container">
						{file.mimetype?.startsWith('image') || file.mimetype?.startsWith('video') ?
							<div role="button" onClick={() => setSelectedFile(file)} style={{ cursor: 'pointer' }}>
								<Image
									className="center img-fluid"
									loader={myLoader}
									src={file.path}
									alt={file.name}
									width={200}
									height={file.type === 'DIRECTORY' ? 236 : 260}
									style={{
										borderRadius: '8px',
									}}
								/>
							</div>
							:	<Link href={`/files${file.path}`} className="text-decoration-none">
								<Image
									className="center img-fluid"
									loader={myLoader}
									src={file.path}
									alt={file.name}
									width={200}
									height={file.type === 'DIRECTORY' ? 236 : 260}
									style={{
										borderRadius: '8px',
									}}
								/>
							</Link>
						}
						<div className="file-name-overlay text-truncate">{file.name}</div>
					</div>
				))}
			</div>
			<MediaLightBox files={folder.children} selectedFile={selectedFile} setSelectedFile={setSelectedFile } />
			{itemsToShow < folder.children.length && (
				<div ref={observerRef} className="text-center py-3">
					<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>{' '}
					Loading more...
				</div>
			)}
		</>
	);
}