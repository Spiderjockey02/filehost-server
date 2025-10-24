import { useState } from 'react';
import InputField from '../Form/InputField';
import Select from 'react-select';
import { AuditLogEventName } from '@prisma/client';
import axios from 'axios';

export function AdminCreateNewListenerModal() {
	const [data, setData] = useState({
		name: '',
		type: '',
		targetUrl: '',
		events: [] as string[],
	});

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			await axios.post('/api/admin/logs/listeners', data);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className="modal fade" id="AdminCreateNewListenerModal" role="dialog" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title" id="exampleModalLongTitle">Add New Audit Log Listener</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<form onSubmit={handleSave}>
						<div className="modal-body">
							<InputField title='Name' name="Name" onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} />
							<div className='mb-3'>
								<label htmlFor="ListenerType" className="form-label">Type:</label>
								<select id="ListenerType" className="form-select" aria-label="Default select example" onChange={(e) => setData((d) => ({ ...d, type: e.target.value }))}>
									<option value="WEBHOOK">Webhook</option>
									<option value="NOTIFICATION">Notification</option>
								</select>
							</div>
							<InputField title='Target URL' name="TargetURL" onChange={(e) => setData((d) => ({ ...d, targetUrl: e.target.value }))} autocomplete='off' />
							<div className='mb-3'>
								<label htmlFor="ListenerType" className="form-label">Events:</label>
								<Select isMulti options={Object.keys(AuditLogEventName).map((v) => ({ value: v, label: v }))} onChange={(inputValue) => setData((d) => ({ ...d, events: inputValue.map((v) => v.value) }))} />
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" className="btn btn-success">Create</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
