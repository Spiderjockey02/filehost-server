import type { ImageLoaderProps } from 'next/image';
import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DirectoryProps } from '@/types/Components/Views';

export default function PhotoAlbum({ folder }: DirectoryProps) {
	const [itemsToShow, setItemsToShow] = useState(40);
	const observerRef = useRef<HTMLDivElement | null>(null);
	const myLoader = ({ src }: ImageLoaderProps) => `/thumbnail/${folder.userId}${encodeURI(src)}`;

	const files = useMemo(() => {
		return folder.children.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
	}, [folder.children]);
	const visibleFiles = useMemo(() => files.slice(0, itemsToShow), [files, itemsToShow]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && itemsToShow < files.length) setItemsToShow((prev) => Math.min(prev + 40, files.length));
			},
			{ rootMargin: '200px' },
		);

		if (observerRef.current) observer.observe(observerRef.current);
		return () => {
			if (observerRef.current) observer.unobserve(observerRef.current);
		};
	}, [itemsToShow, files.length]);

	return (
		<>
			<div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '5px' }}>
				{visibleFiles.map((file) => (
					<div key={file.name} className="text-center rounded position-relative file-container">
						<Link href={`/files${file.path}`} className="text-decoration-none">
							<Image
								className="center img-fluid"
								loader={myLoader}
								src={file.path}
								alt={file.name}
								width={200}
								height={275}
								style={{
									maxHeight: file.type === 'DIRECTORY' ? '236px' : '260px',
									borderRadius: '8px',
								}}
							/>
						</Link>
						<div className="file-name-overlay text-truncate">{file.name}</div>
					</div>
				))}
			</div>

			{itemsToShow < files.length && (
				<div ref={observerRef} className="text-center py-3">
					<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>{' '}
					Loading more...
				</div>
			)}
		</>
	);
}