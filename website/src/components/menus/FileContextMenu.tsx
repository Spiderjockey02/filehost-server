import { faCopy, faDownload, faEllipsisV, faFileSignature, faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { DeleteFileModal, RenameFileModal, UpdateLocationModal } from '@/components/Modals';
import type { FileContextMenuProps } from '@/types/Components/Menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useOnClickOutside } from '@/utils/useOnClickOutisde';
import { RefObject, useRef, useState } from 'react';
import ContextMenu from '../UI/ContextMenu';
import axios from 'axios';

export default function FileContextMenu({ x, y, closeContextMenu, selected, showFilePanel }: FileContextMenuProps) {
	const [activeModal, setActiveModal] = useState<string | null>(null);
	const contextMenuRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(contextMenuRef as RefObject<HTMLDivElement>, closeContextMenu);
	const handleDownload = async () => {
		try {
			const { data: blob } = await axios.post('/api/files/download',
				{ id: `${selected[0].id}` },
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
				{activeModal == 'delete' && <DeleteFileModal file={selected[0]} closeContextMenu={closeContextMenu} show={true} onClose={() => setActiveModal(null)} />}
				{activeModal == 'change' && <UpdateLocationModal file={selected[0]} closeContextMenu={closeContextMenu} show={true} onClose={() => setActiveModal(null)} />}
				{activeModal == 'rename' && <RenameFileModal file={selected[0]} closeContextMenu={closeContextMenu} show={true} onClose={() => setActiveModal(null)} />}
				<ContextMenu ref={contextMenuRef} x={x} y={y}>
					<ContextMenu.Button onClick={() => handleCopyURL()}>
						<FontAwesomeIcon icon={faCopy} /> Copy link
					</ContextMenu.Button>
					<ContextMenu.Button onClick={() => handleDownload()}>
						<FontAwesomeIcon icon={faDownload} /> Download
					</ContextMenu.Button>
					<ContextMenu.Button onClick={() => setActiveModal('delete')}>
						<FontAwesomeIcon icon={faTrash} /> Delete
					</ContextMenu.Button>
					<ContextMenu.Button onClick={() => setActiveModal('change')} >
						<FontAwesomeIcon icon={faFolderOpen} /> Move / Copy to
					</ContextMenu.Button>
					<ContextMenu.Button onClick={() => setActiveModal('rename')}>
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