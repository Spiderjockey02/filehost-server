import type { FileViewerProps } from '@/types/Components/Views';
import { VideoPlayer, TextViewer } from '@/components';
import { useToast } from '../Hooks/ToastManager';
import { useRef } from 'react';
import Image from 'next/image';

export default function FileViewer({ file }: FileViewerProps) {
	const { showToast } = useToast();
	const imageRef = useRef<HTMLImageElement>(null);
	function handleFullScreen() {
		if (imageRef.current) {
			if (!document.fullscreenElement) {
				imageRef.current.requestFullscreen().catch(err => console.error('Fullscreen request failed:', err));
			} else {
				document.exitFullscreen();
			}
		}
	}

	// Handle text files or unknown mime types
	if (!file.mimetype || file.mimetype.startsWith('text') || file.mimetype == 'application/javascript' || file.mimetype == 'application/json') return <TextViewer path={`/content/${file.userId}${file.path}`} />;

	// Handle PDF files
	if (file.mimetype == 'application/pdf') {
		return (
			<object data={`/content/${file.userId}${file.path}`} type="application/pdf" style={{ width: '100%', height: '80vh' }}>
				<p>Alternative text - include a link <a href={`/content/${file.userId}${file.path}`}>to the PDF!</a></p>
			</object>
		);
	}

	switch (file.mimetype.split('/')[0]) {
		case 'image':
			return (
				<div className='d-flex justify-content-center' style={{ maxHeight: 'calc(100vh - 130px)', padding: '0 6px' }}>
					<Image className="center" src={`/content/${file.userId}${file.path}`} onClick={handleFullScreen} ref={imageRef} unoptimized={true} onError={() => showToast('error', 'Failed to load image. Please try again later')}
						alt={file.name} width={1000} height={1000} style={{ cursor: 'pointer', maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
					/>
				</div>
			);
		case 'video':
			return <VideoPlayer videoPath={`/content/${file.userId}${file.path}`} thumbnailPath={`/thumbnail/${file.userId}${file.path}`} />;
		default:
			<div className="text-center">
				<p>Unsupported file type: {file.mimetype}</p>
				<a href={`/content/${file.userId}${file.path}`} className="btn btn-primary">Download File</a>
			</div>;
	}
}