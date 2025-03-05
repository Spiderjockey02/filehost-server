import { faCopy, faDownload, faEllipsisV, faFileSignature, faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { DeleteFileModal, RenameFileModal, UpdateLocationModal } from '@/components';
import type { FileContextMenuProps } from '@/types/Components/Menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useOnClickOutside } from '@/utils/useOnClickOutisde';
import { RefObject, useRef } from 'react';
import axios from 'axios';
import ContextMenu from '../UI/ContextMenu';

export default function FileContextMenu({ x, y, closeContextMenu, selected, showFilePanel }: FileContextMenuProps) {
	const contextMenuRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(contextMenuRef as RefObject<HTMLDivElement>, closeContextMenu);
	const handleDownload = async () => {
		try {
			const { data: blob } = await axios.get(`/api/files/download?path=${selected[0].path}`, {
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
				link.download = selected[0].name;
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
		closeContextMenu();
	};

	const handleCopyURL = async () => {
		const url = `${window.location.origin}${window.location.pathname}/${encodeURI(selected[0].name)}`;
		const unsecuredCopyToClipboard = (text: string) => {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
				document.execCommand('copy');
			} catch(err) {
				console.error('Unable to copy to clipboard', err);
			}
			document.body.removeChild(textArea);
		};
		if (window.isSecureContext && navigator.clipboard) {
			navigator.clipboard.writeText(url);
		} else {
			unsecuredCopyToClipboard(url);
		}
		closeContextMenu();
	};

	const handleBulkDownload = async () => {
		const paths = selected.map((file) => file.path);
		const { data: blob } = await axios.post('/api/files/bulk-download', { paths }, {
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
			link.download = `files-${new Date()}.zip`;
			document.body.appendChild(link);
			link.click();
			link.remove();

			// Clean up the URL object
			window.URL.revokeObjectURL(url);
		} else {
			throw new Error('Download failed: Empty file');
		}
		closeContextMenu();
	};

	const handleBulkDelete = async () => {
		const paths = selected.map((file) => file.path);

		try {
			await axios.delete('/api/files/bulk-delete', { data: { paths } });
		} catch (error) {
			console.log(error);
		}
		closeContextMenu();
	};

	// Check if they have multi-selected or not
	if (selected.length === 1) {
		return (
			<>
				<DeleteFileModal file={selected[0]} closeContextMenu={closeContextMenu} />
				<UpdateLocationModal file={selected[0]} closeContextMenu={closeContextMenu} />
				<RenameFileModal file={selected[0]} closeContextMenu={closeContextMenu} />
				<ContextMenu ref={contextMenuRef} x={x} y={y}>
					<ContextMenu.Button onClick={() => handleCopyURL()}>
						<FontAwesomeIcon icon={faCopy} /> Copy link
					</ContextMenu.Button>
					<ContextMenu.Button onClick={() => handleDownload()}>
						<FontAwesomeIcon icon={faDownload} /> Download
					</ContextMenu.Button>
					<ContextMenu.Button BSToggle="modal" BSTarget={`#delete_${selected[0].id}`}>
						<FontAwesomeIcon icon={faTrash} /> Delete
					</ContextMenu.Button>
					<ContextMenu.Button BSToggle="modal" BSTarget={`#change_${selected[0].id}`}>
						<FontAwesomeIcon icon={faFolderOpen} /> Move / Copy to
					</ContextMenu.Button>
					<ContextMenu.Button BSToggle="modal" BSTarget={`#rename_${selected[0].id}`}>
						<FontAwesomeIcon icon={faFileSignature} /> Rename
					</ContextMenu.Button>
					<ContextMenu.Button onClick={() => showFilePanel(selected[0].id)}>
						<FontAwesomeIcon icon={faEllipsisV} /> Properties
					</ContextMenu.Button>
				</ContextMenu>
			</>
		);
	} else {
		return (
			<ContextMenu ref={contextMenuRef} x={x} y={y}>
				<ContextMenu.Button onClick={handleBulkDownload}>
					<FontAwesomeIcon icon={faDownload} /> Download
				</ContextMenu.Button>
				<ContextMenu.Button onClick={handleBulkDelete}>
					<FontAwesomeIcon icon={faTrash} /> Delete
				</ContextMenu.Button>
			</ContextMenu>
		);
	}
}