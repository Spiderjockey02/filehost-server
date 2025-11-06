import { AuditLogEventName } from '@prisma/client';
import { InputField } from '..';
import { useState } from 'react';
import Select from 'react-select';
import { FullAuditLogListener } from '@/types/database';
import axios from 'axios';
import { NewListenerTypes } from '@/types';

interface Props {
  listener: FullAuditLogListener
  refetch: () => void
}

export default function AdminEditListenerModal({ listener, refetch }: Props) {
	const [errors, setErrors] = useState<NewListenerTypes[]>([]);
	const [data, setData] = useState({
		name: listener.name,
		type: `${listener.type}`,
		targetUrl: `${listener.targetUrl}`,
		events: listener.events.map(e => `${e.eventId}`),
		enabled: listener.enabled,
	});

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Check errors
		const tempErrors: NewListenerTypes[] = [];
		if (data.name.trim().length == 0) tempErrors.push({ type: 'name', text: 'This field is missing.' });
		if (data.type == 'WEBHOOK' && data.targetUrl.trim().length == 0) tempErrors.push({ type: 'targetUrl', text: 'This field is missing.' });
		if (data.events.length == 0) tempErrors.push({ type: 'events', text: 'This field is missing.' });
		if (tempErrors.length > 0) return setErrors(tempErrors);

		try {
			await axios.patch(`/api/admin/logs/listeners/${listener.id}`, data);
			refetch();
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className="modal fade" id={listener.id} role="dialog" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title" id="exampleModalLongTitle">Edit Listener: {listener.name}</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<form onSubmit={handleSave}>
						<div className="modal-body">
							<InputField value={listener.name} title='Name' name="Name" errorMsg={errors.find(e => e.type == 'name')?.text} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} />
							<div className='mb-3'>
								<label htmlFor="ListenerType" className="form-label">Type:</label>
								<select defaultValue={listener.type} id="ListenerType" className="form-select" aria-label="Default select example" onChange={(e) => setData((d) => ({ ...d, type: e.target.value }))}>
									<option value="WEBHOOK">Webhook</option>
									<option value="NOTIFICATION">Notification</option>
								</select>
							</div>
							<InputField value={`${listener.targetUrl}`} title='Target URL' name="TargetURL" errorMsg={errors.find(e => e.type == 'targetUrl')?.text} onChange={(e) => setData((d) => ({ ...d, targetUrl: e.target.value }))} autocomplete='off' />
							<div className='mb-3'>
								<label className="form-label">Events:</label>
								<Select isMulti defaultValue={listener.events.map(d => ({ value: `${d.eventId}`, label: `${d.eventId}` }))}
									options={Object.keys(AuditLogEventName).map((v) => ({ value: v, label: v }))} onChange={(inputValue) => setData((d) => ({ ...d, events: inputValue.map((v) => v.value) }))}
								/>
							</div>
							<div className='mb-3'>
								<div className="form-check form-switch">
									<input className="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" defaultChecked={listener.enabled} onChange={(e) => setData((d) => ({ ...d, enabled: e.target.checked }))} />
									<label className="form-check-label" htmlFor="switchCheckDefault">Enabled</label>
								</div>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" className="btn btn-success">Save</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}