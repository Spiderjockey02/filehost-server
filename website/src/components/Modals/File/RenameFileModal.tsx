import type { FileModalProps } from '@/types/Components/Modals';
import { useFolderRefetch } from '../../Hooks/FileManager';
import { BaseSyntheticEvent, useState } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

const InputErrorStyles = (showError: boolean) => showError ? { borderTopColor: 'red', borderLeftColor: 'red', borderBottomColor: 'red' } : {};
const TextErrorStyles = (showError: boolean) => showError ? { borderTopColor: 'red', borderRightColor: 'red', borderBottomColor: 'red' } : {};

export default function RenameFileModal({ file, closeContextMenu, show, onClose }: FileModalProps) {
	const [rename, setRename] = useState(file.name);
	const [errorMsg, setErrorMsg] = useState('');
	const refreshFolder = useFolderRefetch();

	const handleRenameSubmit = async (e: BaseSyntheticEvent) => {
		e.preventDefault();

		if (rename.length == 0) return setErrorMsg('This field is missing.');
		try {
			await axios.post('/api/files/rename', { fileId: file.id, newName: `${rename}${file.type == 'FILE' ? `.${file.name.split('.').at(-1)}` : ''}` });
			refreshFolder();
		} catch (err) {
			if (axios.isAxiosError(err)) return setErrorMsg(err.response?.data.error);
			console.error(err);
		}

		if (closeContextMenu) closeContextMenu();
	};

	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title className='text-break'>
          Rename file: {file.name}
				</Modal.Title>
			</Modal.Header>
			<form onSubmit={handleRenameSubmit} method="post">
				<Modal.Body>
					<div className="input-group mb-3">
						<input className="form-control" autoComplete='off' style={InputErrorStyles(errorMsg.length > 0)} id="renameInput" type="text" name="newPath" defaultValue={file.name.replace(`.${file.name.split('.').at(-1)}`, '')} onChange={(e) => setRename(e.target.value)} />
						{file.type == 'FILE' && <span className="input-group-text" style={TextErrorStyles(errorMsg.length > 0)} id="renameSuffix">.{file.name.split('.').at(-1)}</span>}
					</div>
					{errorMsg && <div className="invalid-feedback" style={{ color: 'red', display: 'block' }}>{errorMsg}</div>}
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
					<button type="submit" className="btn btn-success">Save</button>
				</Modal.Footer>
			</form>
		</Modal>
	);
}