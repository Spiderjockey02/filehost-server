import type { UploadQueueContextType, UploadFile, UploadStatus } from '@/types/Components/Hooks';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { FileUploadActionModal } from '@/components/Modals';
import axios, { AxiosRequestConfig } from 'axios';
import { useFolderRefetch } from './FileManager';

const UploadQueueContext = createContext<UploadQueueContextType | null>(null);
export const UploadQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const queueRef = useRef<UploadFile[]>([]);
	const controllerRef = useRef<AbortController | null>(null);
	const [status, setStatus] = useState<UploadStatus | null>(null);
	const isProcessingRef = useRef(false);
	const refreshFolder = useFolderRefetch();
	const totalBytesRef = useRef(0);


	const [showModal, setShowModal] = useState(false);
	const [modalFileName, setModalFileName] = useState<string | null>(null);
	const actionResolverRef = useRef<(value: string) => void | null>(null);

	const waitForUserAction = () =>
		new Promise<string>((resolve) => {
			actionResolverRef.current = resolve;
			setShowModal(true);
		});

	const handleUserAction = (action: string) => {
		setShowModal(false);
		actionResolverRef.current?.(action);
	};

	const processQueue = async () => {
		isProcessingRef.current = true;
		let uploadedBytes = 0;
		const startAt = Date.now();

		while (queueRef.current.length > 0) {
			const forUploading = queueRef.current.shift();
			if (!forUploading) break;

			const { file, parentId } = forUploading;

			setStatus({
				filename: file.name,
				progress: 0,
				remaining: 'Calculating...',
				error: undefined,
			});

			const formData = new FormData();
			formData.append('media', file);
			formData.append('metadata', JSON.stringify({ parentId }));

			controllerRef.current = new AbortController();
			let previousLoaded = 0;

			try {
				const options: AxiosRequestConfig = {
					headers: { 'Content-Type': 'multipart/form-data' },
					signal: controllerRef.current.signal,
					onUploadProgress: ({ loaded }) => {
						const incrementalBytes = loaded - previousLoaded;
						previousLoaded = loaded;
						uploadedBytes += incrementalBytes;

						const percentage = Math.min((uploadedBytes * 100) / totalBytesRef.current, 100);
						const timeElapsed = (Date.now() - startAt) / 1000;
						let timeString = '';
						if (timeElapsed > 0) {
							const uploadSpeed = uploadedBytes / timeElapsed;
							const remainingTime = (totalBytesRef.current - uploadedBytes) / uploadSpeed;

							const hours = Math.floor(remainingTime / 3600);
							const minutes = Math.floor((remainingTime % 3600) / 60);
							const seconds = Math.floor(remainingTime % 60);

							if (hours > 0) timeString += `${hours}h `;
							timeString += `${minutes}m ${seconds}s`;
						}

						setStatus({
							filename: file.name,
							progress: +percentage.toFixed(2),
							remaining: timeString,
						});
					},
				};

				await axios.post('/api/files/upload', formData, options);
				refreshFolder();
			} catch (err) {
				setStatus({
					filename: file.name,
					progress: 0,
					remaining: '',
					error: 'Upload failed',
				});

				if (axios.isAxiosError(err)) {
					if (err.response?.data?.error === 'File with that name already exists') {
						setModalFileName(file.name);
						const userChoice = await waitForUserAction();
						switch (userChoice) {
							case 'cancel':
								console.log('Upload cancelled by user');
								break;
							case 'replace':
								console.log('User chose replace');
								break;
							case 'keep':
								console.log('User chose to keep both');
								break;
							default:
								console.log('error');
						}
						continue;
					}
				}
			}
		}

		isProcessingRef.current = false;
		setTimeout(() => {
			totalBytesRef.current = 0;
			setStatus(null);
		}, 500);
	};

	const addToQueue = (files: FileList | File[], parentId: string) => {
		for (const file of files) {
			queueRef.current.push({ file, parentId });
			totalBytesRef.current += file.size;
		}
		if (!isProcessingRef.current) processQueue();
	};

	const cancelUpload = useCallback(() => {
		controllerRef.current?.abort();
		setStatus(null);
		isProcessingRef.current = false;
		totalBytesRef.current = 0;
		queueRef.current = [];
	}, []);

	return (
		<UploadQueueContext.Provider value={{ addToQueue, status, cancelUpload }}>
			{children}
			<FileUploadActionModal fileName={modalFileName || ''} show={showModal} onAction={handleUserAction} />
		</UploadQueueContext.Provider>
	);
};

export const useUploadQueue = () => {
	const ctx = useContext(UploadQueueContext);
	if (!ctx) throw new Error('UploadQueueContext not available');
	return ctx;
};
