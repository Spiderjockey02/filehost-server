import axios from 'axios';
import { BaseSyntheticEvent, useState } from 'react';
import InputField from '../Form/InputField';
import SuccessPopup from '../Toasts/SuccessPopup';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';
import { StorageWithCounts } from '@/types/database';

interface Props {
	refreshTable: (options?: RefetchOptions) => Promise<QueryObserverResult<{
    storages: StorageWithCounts[];
	}, Error>>
}

export function AdminCreateNewMediumModal({ refreshTable }: Props) {
	const [storage, setStorage] = useState({
		type: 'FILE_SYSTEM',
		isPrivate: false,
	});
	const [errorMsg, setErrorMsg] = useState('');
	const [successMsg, setSuccessMsg] = useState('');

	async function createNewStorage(e: BaseSyntheticEvent) {
		e.preventDefault();

		try {
			const { data } = await axios.post('/api/admin/storage', storage);
			setSuccessMsg(data.success);
			await refreshTable();
		} catch (err) {
			if (axios.isAxiosError(err)) return setErrorMsg(err.response?.data.error);
			console.error(err);
		}
	}

	return (
		<>
			<div className="modal fade" id="AdminCreateNewMediumModal" role="dialog" aria-hidden="true">
				{successMsg.length > 0 && <SuccessPopup text={successMsg} />}
				<div className="modal-dialog modal-dialog-centered" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title" id="exampleModalLongTitle">Add New Storage Medium</h5>
							<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div className="modal-body">
							<form onSubmit={createNewStorage} method="post">
								<InputField title='Name' name="name" errorMsg={errorMsg.startsWith('name') ? errorMsg : ''} autocomplete='off' onChange={(e) => setStorage((s) => ({ ...s, name: e.target.value }))} />

								<div className="mb-3">
									<label htmlFor="storageType" className="form-label">Type:</label>
									<select className="form-select" id="storageType" required style={errorMsg.startsWith('type') ? { borderColor: 'red' } : {}} onChange={(e) => setStorage((s) => ({ ...s, type: e.target.value }))}>
										<option value="FILE_SYSTEM">Local</option>
										<option value="S3">S3</option>
									</select>
									{errorMsg.startsWith('type') && <div className="invalid-feedback" style={{ color: 'red', display: 'block' }}>{errorMsg}</div>}
								</div>

								<InputField title='Base Path' name="Base Path" placeholder="/storage/medium1" errorMsg={errorMsg.startsWith('basePath') ? errorMsg : ''} onChange={(e) => setStorage((s) => ({ ...s, basePath: e.target.value }))} />

								<InputField title='Location' name="Location" placeholder="Europe" errorMsg={errorMsg.startsWith('location') ? errorMsg : ''} onChange={(e) => setStorage((s) => ({ ...s, location: e.target.value }))} />

								<hr />
								<h6 className="text-muted">Optional Fields</h6>

								<InputField title='Endpoint' name="Endpoint" placeholder="s3://.../<bucket>" errorMsg={errorMsg.startsWith('endpoint') ? errorMsg : ''} onChange={(e) => setStorage((s) => ({ ...s, endpoint: e.target.value }))} />

								<InputField title='Max Size (GB)' name="Max Size (GB)" type="number" errorMsg={errorMsg.startsWith('maxSize') ? errorMsg : ''} onChange={(e) => setStorage((s) => ({ ...s, maxSize: e.target.value }))} />

								<div className="form-check mb-3">
									<input className="form-check-input" type="checkbox" id="isPrivate" onChange={(e) => setStorage((s) => ({ ...s, isPrivate: e.target.checked }))} />
									<label className="form-check-label" htmlFor="isPrivate">
									Private only
									</label>
								</div>
							</form>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" className="btn btn-success" onClick={createNewStorage}>Create</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
