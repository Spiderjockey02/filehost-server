import { FileModalProps } from '@/types/Components/Modals';
import { BaseSyntheticEvent, useState } from 'react';
import { useFileDispatch } from '../fileManager';
import axios from 'axios';

const InputErrorStyles = (showError: boolean) => showError ? { borderTopColor: 'red', borderLeftColor: 'red', borderBottomColor: 'red' } : {};
const TextErrorStyles = (showError: boolean) => showError ? { borderTopColor: 'red', borderRightColor: 'red', borderBottomColor: 'red' } : {};
export default function RenameFileModal({ file, closeContextMenu }: FileModalProps) {
	const [rename, setRename] = useState(file.name);
	const [errorMsg, setErrorMsg] = useState('');
	const dispatch = useFileDispatch();

	function closeModal(id: string) {
		document.getElementById(id)?.classList.remove('show');
		document.getElementById(id)?.setAttribute('aria-hidden', 'true');
		document.getElementById(id)?.setAttribute('style', 'display: none');
		document.body.removeChild(document.getElementsByClassName('modal-backdrop')[0] as Node);
		if (closeContextMenu) closeContextMenu();
	}

	const handleRenameSubmit = async (e: BaseSyntheticEvent) => {
		const oldName = file.name;
		e.preventDefault();

		try {
			await axios.post('/api/files/rename', { oldName, newName: file.type == 'FILE' ? `${rename}.${file.name.split('.').at(-1)}` : rename });
			const { data } = await axios.get(`/api/files/${window.location.pathname.replace('/files', '/')}`);
			dispatch({ type: 'SET_FILE', payload: data.file });
		} catch (err) {
			if (axios.isAxiosError(err)) return setErrorMsg(err.response?.data.error);
			console.error(err);
		}

		closeModal(`rename_${file.id}`);
	};

	return (
		<div className="modal fade" id={`rename_${file.id}`} role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title text-truncate" id="exampleModalLongTitle">Rename {file.name}</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<form onSubmit={handleRenameSubmit} method="post">
						<div className="modal-body">
							<input type="hidden" id="oldPath" name="oldPath" value={file.name} />
							<div className="input-group mb-3">
								<input className="form-control" autoComplete='off' style={InputErrorStyles(errorMsg.length > 0)} id="renameInput" type="text" name="newPath" defaultValue={file.name.replace(`.${file.name.split('.').at(-1)}`, '')} onChange={(e) => setRename(e.target.value)} />
								{file.type == 'FILE' && <span className="input-group-text" style={TextErrorStyles(errorMsg.length > 0)} id="renameSuffix">.{file.name.split('.').at(-1)}</span>}
							</div>
							{errorMsg && <div className="invalid-feedback" style={{ color: 'red', display: 'block' }}>{errorMsg}</div>}
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
							<button type="submit" className="btn btn-primary">Save</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}