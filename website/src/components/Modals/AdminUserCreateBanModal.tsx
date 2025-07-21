import axios from 'axios';
import { BaseSyntheticEvent, useState } from 'react';
import InputField from '../Form/InputField';

interface Props {
  userId: string
}

export default function AdminUserCreateBanModal({ userId }: Props) {
	const [data, setData] = useState({
		expiresAt: new Date(),
		reason: '',
	});

	const handleSubmit = async (e: BaseSyntheticEvent) => {
		e.preventDefault();
		try {
			await axios.post(`/api/admin/users/${userId}/ban`, {
				...data,
				userId,
			});
		} catch (err) {
			console.log(err);
		}
	};

	return (
		<div className="modal fade" id="AdminUserCreateBanModal" tabIndex={-1} aria-labelledby="storageMigrateModalLabel" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title fw-bold" id="storageMigrateModalLabel">Ban user</h4>
						<button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body">
						<InputField title="Reason" name="Reason" onChange={(e) => setData({ ...data, reason: e.target.value })} />
						<InputField title="Expires At" name="ExpiresAt" type="datetime-local" onChange={(e) => setData({ ...data, expiresAt: new Date(e.target.value) })} />
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