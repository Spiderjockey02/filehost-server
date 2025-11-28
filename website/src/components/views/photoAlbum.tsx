import type { DirectoryProps } from '@/types/Components/Views';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { ImageLoaderProps } from 'next/image';
import Image from 'next/image';
import Link from 'next/link';

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
			<div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, max-content))', gap: '5px', justifyContent: 'start' }}>
				{visibleFiles.map((file) => (
					<div key={file.name} className="text-center rounded position-relative file-container">
						<Link href={`/files${file.path}`} className="text-decoration-none">
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