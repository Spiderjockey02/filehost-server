import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useRef, DragEvent } from 'react';
import { useUploadQueue } from '../Hooks/UploadContentManager';
import type { DragUploadFieldProps } from '@/types/Components/Form';

export default function DragUploadField({ children, parentId }: DragUploadFieldProps) {
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

		const items = e.dataTransfer.items;
		if (!items || items.length === 0) {
			return alert('No items were dropped');
		}

		const files: File[] = [];
		for (const item of items) {
			const entry = item.webkitGetAsEntry?.();
			if (entry) {
				const collected = await traverseFileTree(entry);
				files.push(...collected);
			}
		}
		console.log(files);
		addToQueue(files, parentId);
	};

	return (
		<>
			<div className='position-relative' style={{ border: isDragging ? '1px dashed #0d6efd' : '', backgroundColor: isDragging ? '#f8f9fa' : 'transparent', transition: 'all 0.3s ease-in-out', minHeight: '50vh' }} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
				{isDragging && (
					<div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center text-white fw-bold fs-4 d-flex flex-column align-items-center justify-content-center text-primary">
						<FontAwesomeIcon icon={faCloudArrowUp} />
						<p className="mt-2 fw-bold">Release to upload</p>
					</div>
				)}
				<input type="file" multiple hidden={true} id="fileInput" webkitdirectory="true" directory="true" />
				{children}
			</div>
		</>
	);
}

function traverseFileTree(entry: any, path = ''): Promise<File[]> {
	return new Promise((resolve) => {
		if (entry.isFile) {
			entry.file((file: File) => {
				const relativePath = path + file.name;

				const renamedFile = new File([file], relativePath, {
					type: file.type,
					lastModified: file.lastModified,
				});

				resolve([renamedFile]);
			});
		} else if (entry.isDirectory) {
			const dirReader = entry.createReader();
			const entries: any[] = [];

			// readEntries has a cap of 100 so we must loop if we want more than 100 children
			const readAllEntries = (): void => {
				dirReader.readEntries(async (batch: any[]) => {
					if (batch.length) {
						entries.push(...batch);
						readAllEntries();
					} else {
						const promises = entries.map((ent) =>
							traverseFileTree(ent, path + entry.name + '/'),
						);
						const results = await Promise.all(promises);
						resolve(results.flat());
					}
				});
			};

			readAllEntries();
		} else {
			resolve([]);
		}
	});
}