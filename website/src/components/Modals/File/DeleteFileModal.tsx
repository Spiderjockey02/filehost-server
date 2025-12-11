import type { FileModalProps } from '@/types/Components/Modals';
import { useFolderRefetch } from '../../Hooks/FileManager';
import type { BaseSyntheticEvent } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

export default function DeleteFileModal({ file, show, onClose, closeContextMenu }: FileModalProps) {
	const refreshFolder = useFolderRefetch();

	const onSubmit = async (e: BaseSyntheticEvent) => {
		e.preventDefault();
		try {
			await axios.delete('/api/files/delete', {
				data: { fileId: file.id },
			});
			refreshFolder();
		} catch (err) {
			console.log(err);
		}
		if (closeContextMenu) closeContextMenu();
	};

	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title className='text-break'>
          Delete file: {file.name}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				Are you sure you want to send this item to the recycle bin?
			</Modal.Body>
			<Modal.Footer>
				<button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
				<button type="button" className="btn btn-danger" onClick={onSubmit}>Delete</button>
			</Modal.Footer>
		</Modal>
	);
}