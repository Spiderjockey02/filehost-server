import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useRef, DragEvent, ReactNode } from 'react';
import { useUploadQueue } from '../Hooks/UploadContentManager';

interface Props {
  children: ReactNode
	parentId: string
}

export default function DragUploadField({ children, parentId }: Props) {
	const [isDragging, setIsDragging] = useState(false);
	const dragCounter = useRef(0);
	const { addToQueue } = useUploadQueue();

	const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current += 1;
		if (!isDragging) setIsDragging(true);
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current -= 1;

		// Ensure the overlay disappears only when completely leaving the drop zone
		if (dragCounter.current === 0) {
			setTimeout(() => {
				setIsDragging(false);
			}, 100);
		}
	};

	const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		dragCounter.current = 0;

		const fileInput = e.dataTransfer;
		if (!fileInput.files || fileInput.files.length === 0) {
			return alert('Files list is empty');
		}

		addToQueue(fileInput.files, parentId);
	};

	return (
		<>
			<div className='position-relative' style={{ border: isDragging ? '1px dashed #0d6efd' : '', backgroundColor: isDragging ? '#f8f9fa' : 'transparent', transition: 'all 0.3s ease-in-out' }} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
				{isDragging && (
					<div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center text-white fw-bold fs-4 d-flex flex-column align-items-center justify-content-center text-primary">
						<FontAwesomeIcon icon={faCloudArrowUp} />
						<p className="mt-2 fw-bold">Release to upload</p>
					</div>
				)}
				<input type="file" multiple hidden={true} id="fileInput" />
				{children}
			</div>
		</>
	);
}
