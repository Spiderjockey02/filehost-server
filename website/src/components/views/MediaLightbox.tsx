import { faChevronLeft, faX, faChevronRight, faDownload, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import type { MediaLightBoxProps } from '@/types/Components/Views';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VideoPlayer from './VideoPlayer';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';

export default function MediaLightBox({ files, selectedFile, setSelectedFile }: MediaLightBoxProps) {
	const currentIndex = files.findIndex(f => f === selectedFile);
	const next = (e?: React.MouseEvent) => {
		e?.stopPropagation();
		if (currentIndex < files.length - 1) setSelectedFile(files[currentIndex + 1]);
	};

	const prev = (e?: React.MouseEvent) => {
		e?.stopPropagation();
		if (currentIndex > 0) setSelectedFile(files[currentIndex - 1]);
	};

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (!selectedFile) return;

			if (e.key === 'ArrowRight') next();
			if (e.key === 'ArrowLeft') prev();
			if (e.key === 'Escape') setSelectedFile(null);
		};

		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [selectedFile, currentIndex]);

	useEffect(() => {
		if (!selectedFile) return;

		const preload = (file?: typeof selectedFile) => {
			if (!file) return;

			if (!file.mimetype?.startsWith('video')) {
				const img = new window.Image();
				img.src = `/content/${file.userId}${file.path}`;
			} else {
				const img = new window.Image();
				img.src = `/thumbnail/${file.userId}${encodeURI(file.path)}`;
			}
		};

		preload(files[currentIndex + 1]);
		preload(files[currentIndex - 1]);
	}, [selectedFile, files]);

	const handleDownload = async () => {
		try {
			const { data: blob } = await axios.post('/api/files/download',
				{ id: `${selectedFile!.id}` },
				{
					headers: {
						'Accept': 'application/zip',
					},
					responseType: 'blob',
				});

			if (blob.size > 0) {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;

				// Specify the file name for the downloaded file
				link.download = selectedFile!.name;
				document.body.appendChild(link);
				link.click();
				link.remove();

				// Clean up the URL object
				window.URL.revokeObjectURL(url);
			} else {
				throw new Error('Download failed: Empty file');
			}
		} catch (error) {
			console.log(error);
		}
	};

	// If no selected file don't show
	if (selectedFile == null) return null;
	return (
		<div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)', zIndex: 2000 }} onClick={() => setSelectedFile(null)}>
			<div className="nav-arrow left">
				<FontAwesomeIcon
					icon={faChevronLeft}
					onClick={currentIndex > 0 ? prev : undefined}
					className={`arrow ${currentIndex > 0 ? 'active' : 'disabled'}`}
				/>
			</div>
			<div className="viewer-content" onClick={(e) => e.stopPropagation()}>
				{selectedFile.mimetype?.startsWith('video') ?
					<VideoPlayer videoPath={`/content/${selectedFile.userId}${selectedFile.path}`} />
				 : <Image
						unoptimized
						src={`/content/${selectedFile.userId}${selectedFile.path}`}
						alt={selectedFile.name}
						width={1200}
						height={900}
						className="viewer-media"
					/>
				}
			</div>

			<div className="viewer-controls">
				<button onClick={handleDownload} className="control-btn">
					<FontAwesomeIcon icon={faDownload} />
				</button>
				<Link href={`/files/${selectedFile.path}`} className="control-btn">
					<FontAwesomeIcon icon={faUpRightFromSquare} />
				</Link>
				<button onClick={() => setSelectedFile(null)} className="control-btn close">
					<FontAwesomeIcon icon={faX} />
				</button>
			</div>
			<div className="nav-arrow right">
				<FontAwesomeIcon
					icon={faChevronRight}
					onClick={currentIndex < files.length - 1 ? next : undefined}
					className={`arrow ${currentIndex < files.length - 1 ? 'active' : 'disabled'}`}
				/>
			</div>
		</div>
	);
}