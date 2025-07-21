import type { UploadQueueContextType, UploadFile, UploadStatus } from '@/types/Components/Hooks';
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { useFolderRefetch } from './FileManager';
const UploadQueueContext = createContext<UploadQueueContextType | undefined>(undefined);

export const UploadQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const queueRef = useRef<UploadFile[]>([]);
	const controllerRef = useRef<AbortController | null>(null);
	const [status, setStatus] = useState<UploadStatus>(null);
	const isProcessingRef = useRef(false);
	const refreshFolder = useFolderRefetch();
	const totalBytesRef = useRef(0);

	const processQueue = async () => {
		isProcessingRef.current = true;
		let uploadedBytes = 0;
		const startAt = Date.now();

		while (queueRef.current.length > 0) {
			const forUploading = queueRef.current.shift();
			if (!forUploading) break;
			const { file, parentId } = forUploading;

			setStatus(prev => ({
				filename: file.name,
				progress: prev?.progress ?? 0,
				remaining: prev?.remaining ?? 'Calculating...',
				error: undefined,
			}));

			const formData = new FormData();
			formData.append('media', file);
			formData.append('metadata', JSON.stringify({ parentId }));

			controllerRef.current = new AbortController();
			let previousLoaded = 0;
			try {
				const options: AxiosRequestConfig = {
					headers: { 'Content-Type': 'multipart/form-data' },
					responseType: 'json',
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
							remaining: timeElapsed > 0 ? timeString : 'Calculating...',
							error: undefined,
						});
					},
				};

				const { data } = await axios.post('/api/files/upload', formData, options);
				if (data?.error === 'File with that name already exists') {
					setStatus({
						filename: file.name,
						progress: 0,
						remaining: '',
						error: data.error,
					});
					continue;
				}

				refreshFolder();
			} catch (err) {
				if (axios.isAxiosError(err)) {
					setStatus({
						filename: file.name,
						progress: 0,
						remaining: '',
						error: err.response?.data?.error || 'Upload failed',
					});
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
		console.log('Cancelling upload');
		controllerRef.current?.abort();
		setStatus(null);
		isProcessingRef.current = false;
		totalBytesRef.current = 0;
		queueRef.current = [];
	}, []);

	return (
		<UploadQueueContext.Provider value={{ addToQueue, status, cancelUpload }}>
			{children}
		</UploadQueueContext.Provider>
	);
};

export const useUploadQueue = () => {
	const ctx = useContext(UploadQueueContext);
	if (!ctx) throw new Error('UploadQueueContext not available');
	return ctx;
};
