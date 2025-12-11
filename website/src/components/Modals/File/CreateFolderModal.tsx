import type { CreateFolderModalProps } from '@/types/Components/Modals';
import { useFolderRefetch } from '../../Hooks/FileManager';
import { BaseSyntheticEvent, useState } from 'react';
import { InputField } from '@/components';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

export default function CreateFolderModal({ parentId, show, setShow }: CreateFolderModalProps) {
	const [folderName, setFolderName] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const refreshFolder = useFolderRefetch();

	async function handleFolderSubmit(event: BaseSyntheticEvent) {
		event.preventDefault();
		try {
			await axios.post('/api/files/create-folder', {
				folderName: folderName,
				parentId: parentId,
			});
			setFolderName('');
			refreshFolder();
		} catch (error) {
			if (axios.isAxiosError(error)) return setErrorMsg(error.response?.data.error);
			console.error(error);
		}
	}

	function onClose() {
		setFolderName('');
		setErrorMsg('');
		setShow(false);
	}

	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>Create folder</Modal.Title>
			</Modal.Header>
			<form onSubmit={handleFolderSubmit}>
				<Modal.Body>
					<InputField title='Folder name' name="folder" onChange={(e) => setFolderName(e.target.value)} errorMsg={errorMsg} autocomplete='off' />
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
					<button type="submit" className="btn btn-success">Create</button>
				</Modal.Footer>
			</form>
		</Modal>
	);
}