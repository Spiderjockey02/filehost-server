import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { useSetFolder } from './FileManager';
import { usePathname } from 'next/navigation';
import type { UploadQueueContextType, UploadFile, UploadStatus } from '@/types/Components/Hooks';

const UploadQueueContext = createContext<UploadQueueContextType | undefined>(undefined);

export const UploadQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const queueRef = useRef<UploadFile[]>([]);
	const controllerRef = useRef<AbortController | null>(null);
	const [status, setStatus] = useState<UploadStatus>(null);
	const isProcessingRef = useRef(false);
	const setFolder = useSetFolder();
	const path = usePathname();
	const totalBytesRef = useRef(0);

	const processQueue = async () => {
		isProcessingRef.current = true;
		let uploadedBytes = 0;
		const startAt = Date.now();

		while (queueRef.current.length > 0) {
			const { file, parentId } = queueRef.current.shift()!;
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
					headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
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

				const { data: { file: uploadedFile } } = await axios.get(`/api${path}`);
				setFolder(uploadedFile);
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

		totalBytesRef.current = 0;
		isProcessingRef.current = false;
	};

	const addToQueue = useCallback((files: FileList, parentId: string) => {
		console.log('Adding files to queue:', files);
		const fileObjects = Array.from(files).map((file) => ({ file, parentId }));
		queueRef.current.push(...fileObjects);

		for (const f of fileObjects) {
			totalBytesRef.current += f.file.size;
		}

		if (!isProcessingRef.current) processQueue();
	}, []);

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
