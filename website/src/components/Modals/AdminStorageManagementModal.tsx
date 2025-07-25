import { StorageWithCounts } from '@/types/database';
import InputField from '../Form/InputField';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import axios from 'axios';

interface Props {
	storage: StorageWithCounts
}

export function AdminStorageManagementModal({ storage }: Props) {
	const [data, setData] = useState({
		name: storage.name,
		maxSize: storage.maxSize,
		isPrivate: storage.isPrivate,
	});


	async function handleSubmit(event: MouseEvent<HTMLButtonElement>) {
		event.preventDefault();
		try {
			await axios.post(`/api/admin/storage/${storage.id}`, {
				...data,
			});
		} catch (err) {
			console.error('Error updating storage:', err);
		}
	}


	return (
		<div className="modal fade" id={`storageMigrateModal_${storage.id}`} tabIndex={-1} aria-labelledby="storageMigrateModalLabel" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title fw-bold" id="storageMigrateModalLabel">Storage: {storage.name}</h4>
						<button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body">
						<div className="mb-4">
							<ul className="list-group list-group-flush">
								<li className="list-group-item">
									<InputField title="Name" name="name" placeholder={storage.name} autocomplete='off' onChange={(e) => setData({ ...data, name: e.target.value })} />
									<InputField title="Max Bytes (GB)" name="Max Bytes (GB)" type='number' placeholder={`${storage.maxSize}`} onChange={(e) => setData({ ...data, maxSize: Number(e.target.value) })} />
									<div className="form-check">
										<input className="form-check-input" type="checkbox" defaultChecked={storage.isPrivate} id="checkDefault" />
										<label className="form-check-label" htmlFor="checkDefault" onClick={() => setData({ ...data, isPrivate: !data.isPrivate })}>
											Is Private
										</label>
									</div>
								</li>
							</ul>
						</div>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
						<button type="submit" onClick={handleSubmit} className="btn btn-success">Save</button>
					</div>
				</div>
			</div>
		</div>
	);
}