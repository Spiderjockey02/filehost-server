import type { ImageLoaderProps } from 'next/image';
import { useState, useMemo } from 'react';
import type { fileItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  folder: fileItem;
}

export default function PhotoAlbum({ folder }: Props) {
	const [page, setPage] = useState(0);
	const [pageCount, setPageCount] = useState(40);
	const totalItems = folder.children.length;
	const totalPages = Math.floor(totalItems / pageCount);

	// Custom image loader for Next.js
	const myLoader = ({ src }: ImageLoaderProps) => `/thumbnail/${folder.userId}${src}`;

	// Memoized sorted and paginated files
	const paginatedFiles = useMemo(() => {
		return folder.children.slice(page * pageCount, (page + 1) * pageCount);
	}, [folder.children, page, pageCount]);

	// Handle page size change
	const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newSize = parseInt(event.target.value, 10);
		setPage(0);
		setPageCount(newSize);
	};

	return (
		<>
			<div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '5px' }}>
				{paginatedFiles.filter(f => f.type == 'DIRECTORY').map((file) => (
					<div key={file.name} className="text-center rounded position-relative file-container">
						<Link href={`/files${file.path}`} className="text-decoration-none">
							<Image className="center img-fluid" loader={myLoader} src={file.path}
								alt={file.name} width={200} height={275}
								style={{ maxHeight: file.type === 'DIRECTORY' ? '236px' : '260px', borderRadius: '8px' }}
							/>
						</Link>
						<div className="file-name-overlay text-truncate">
								{file.name}
						</div>
					</div>
				))}
				{paginatedFiles.filter(f => f.type == 'FILE').map((file) => (
					<div key={file.name} className="text-center rounded position-relative file-container">
						<Link href={`/files${file.path}`} className="text-decoration-none">
							<Image className="center img-fluid" loader={myLoader} src={file.path}
								alt={file.name} width={200} height={275}
								style={{ maxHeight: file.type === 'DIRECTORY' ? '236px' : '260px', borderRadius: '8px' }}
							/>
							<div className="file-name-overlay text-truncate">
								{file.name}
							</div>
						</Link>
					</div>
				))}
			</div>

			{totalItems > pageCount && (
				<div className="d-flex flex-column align-items-center mt-3">
					<div className="d-flex align-items-center mb-2">
						<p className="mb-0 me-2">
							Showing {page * pageCount + 1} to {Math.min((page + 1) * pageCount, totalItems)} out of {totalItems}
						</p>
						<select className="form-select form-select-sm w-auto" value={pageCount} onChange={handlePageSizeChange}>
							<option value="20">20 per page</option>
							<option value="40">40 per page</option>
							<option value="60">60 per page</option>
							<option value="100">100 per page</option>
						</select>
					</div>

					<nav aria-label="Page navigation">
						<ul className="pagination">
							<li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
								<button className="page-link" onClick={() => setPage(Math.max(page - 1, 0))} aria-label="Previous">
									<span aria-hidden="true">&laquo;</span>
								</button>
							</li>
							<li className="page-item">
								<button className="page-link" onClick={() => setPage(0)}>1</button>
							</li>
							<li className="page-item disabled">
								<span className="page-link">{page + 1}</span>
							</li>
							<li className="page-item">
								<button className="page-link" onClick={() => setPage(totalPages)}>{totalPages + 1}</button>
							</li>
							<li className={`page-item ${page == totalPages ? 'disabled' : ''}`}>
								<button className="page-link" onClick={() => setPage(Math.min(page + 1, totalPages))} aria-label="Next">
									<span aria-hidden="true">&raquo;</span>
								</button>
							</li>
						</ul>
					</nav>
				</div>
			)}
		</>
	);
}
