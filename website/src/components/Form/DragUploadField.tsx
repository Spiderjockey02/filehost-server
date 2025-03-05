import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios, { AxiosRequestConfig } from 'axios';
import { useState, useRef, DragEvent, ReactNode } from 'react';
import { ErrorPopup, UploadStatusToast } from '..';
import { useFileDispatch } from '../fileManager';

interface Props {
  children: ReactNode
	path: string
}

export default function DragUploadField({ children, path }: Props) {
	const [isDragging, setIsDragging] = useState(false);
	const dragCounter = useRef(0);
	const [progress, setProgress] = useState(0);
	const [timeRemaining, setRemaining] = useState('');
	const [filename, setFilename] = useState('');
	const [abortController] = useState(new AbortController());
	const [errorMsg, setErrorMsg] = useState('');
	const dispatch = useFileDispatch();

	const cancelUpload = () => abortController.abort();

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

		const files = Array.from(fileInput.files);
		const totalSize = files.reduce((acc, file) => acc + file.size, 0);
		let uploadedBytes = 0;
		const startAt = Date.now();

		try {
			for (const file of files) {
				setFilename(file.name);

				const formData = new FormData();
				formData.append('media', file);
				let previousLoaded = 0;

				const options: AxiosRequestConfig = {
					headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' },
					responseType: 'json',
					validateStatus: () => true,
					onUploadProgress: ({ loaded }) => {
						// Calculate incremental progress for the current file
						const incrementalBytes = loaded - previousLoaded;
						previousLoaded = loaded;
						uploadedBytes += incrementalBytes;

						// Update the cumulative progress percentage
						const percentage = (uploadedBytes * 100) / totalSize;
						setProgress(+percentage.toFixed(2));

						const timeElapsed = (Date.now() - startAt) / 1000;
						if (timeElapsed > 0) {
							const uploadSpeed = uploadedBytes / timeElapsed;
							const remainingTime = (totalSize - uploadedBytes) / uploadSpeed;

							const hours = Math.floor(remainingTime / 3600);
							const minutes = Math.floor((remainingTime % 3600) / 60);
							const seconds = Math.floor(remainingTime % 60);

							let timeString = '';
							if (hours > 0) timeString += `${hours}h `;
							timeString += `${minutes}m ${seconds}s`;

							setRemaining(timeString.trim());
						} else {
							setRemaining('Calculating...');
						}
					},
				};
				const t = await axios.post('/api/files/upload', formData, options);
				console.log(t);
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				console.log(error);
				setErrorMsg(error.response?.data.error);
				if (error.code === 'ERR_CANCELED') alert('Sorry! Something went wrong.');
			}
		} finally {
			const { data: { file: uploadedFile } } = await axios.get(`/api/files/${path}`);
			dispatch({ type: 'SET_FILE', payload: uploadedFile });
			setProgress(0);
			setRemaining('');
		}
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
			<UploadStatusToast percentage={progress} filename={filename} show={progress > 0} timeRemaining={timeRemaining} cancelUpload={cancelUpload} />
			{errorMsg.length > 0 && <ErrorPopup text={errorMsg} onClose={() => setErrorMsg('')} />}
		</>
	);
}