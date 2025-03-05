import axios from 'axios';
import { BaseSyntheticEvent, useState } from 'react';
import InputField from '../Form/InputField';

export default function CreateFolderModal() {
	const [folderName, setFolderName] = useState('');
	const [errorMsg, setErrorMsg] = useState('');

	function closeModal(id: string) {
		document.getElementById(id)?.classList.remove('show');
		document.getElementById(id)?.setAttribute('aria-hidden', 'true');
		document.getElementById(id)?.setAttribute('style', 'display: none');
		document.body.removeChild(document.getElementsByClassName('modal-backdrop')[0] as Node);
	}

	async function handleFolderSubmit(event: BaseSyntheticEvent) {
		event.preventDefault();
		try {
			await axios.post('/api/files/create-folder', {
				folderName: folderName,
			});
			closeModal('createFolderModal');
			setFolderName('');
		} catch (error) {
			if (axios.isAxiosError(error)) return setErrorMsg(error.response?.data.error);
			console.error(error);
		}
	}

	return (
		<div className="modal fade" id="createFolderModal" role="dialog" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title" id="exampleModalLongTitle">Create a new folder</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<form onSubmit={handleFolderSubmit} method="post">
						<div className="modal-body">
							<InputField title='Folder name' name="folder" onChange={(e) => setFolderName(e.target.value)} errorMsg={errorMsg} />
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
							<button type="submit" className="btn btn-success">Create</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}