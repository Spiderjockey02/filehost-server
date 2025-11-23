import type { AdminEditListenerModalProps } from '@/types/Components/Modals';
import type { AuditListenerFormError } from '@/types/errors';
import { useToast } from '@/components/Hooks/ToastManager';
import { AuditLogEventName } from '@prisma/client';
import { Modal } from 'react-bootstrap';
import { InputField } from '../..';
import Select from 'react-select';
import { useState } from 'react';
import axios from 'axios';

export default function AdminEditListenerModal({ listener, refetch, onClose, show }: AdminEditListenerModalProps) {
	const [errors, setErrors] = useState<AuditListenerFormError[]>([]);
	const { showToast } = useToast();
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
		const tempErrors: AuditListenerFormError[] = [];
		if (data.name.trim().length == 0) tempErrors.push({ type: 'name', message: 'This field is missing.' });
		if (data.type == 'WEBHOOK' && data.targetUrl.trim().length == 0) tempErrors.push({ type: 'targetUrl', message: 'This field is missing.' });
		if (data.events.length == 0) tempErrors.push({ type: 'events', message: 'This field is missing.' });
		if (tempErrors.length > 0) return setErrors(tempErrors);

		try {
			await axios.patch(`/api/admin/logs/listeners/${listener.id}`, data);
			refetch();
			showToast('success', 'The log listener was edited successfully!');
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while editing the log listener.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
		}
	};

	return (
		<Modal show={show} onHide={onClose} centered>
  		<Modal.Header closeButton>
  			<Modal.Title>Edit Listener: {listener.name}</Modal.Title>
  		</Modal.Header>
			<form onSubmit={handleSave}>
  			<Modal.Body>
					<InputField value={listener.name} title='Name' name="Name" errorMsg={errors.find(e => e.type == 'name')?.message} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} />
					<div className='mb-3'>
						<label htmlFor="ListenerType" className="form-label">Type:</label>
						<select defaultValue={listener.type} id="ListenerType" className="form-select" aria-label="Default select example" onChange={(e) => setData((d) => ({ ...d, type: e.target.value }))}>
							<option value="WEBHOOK">Webhook</option>
							<option value="NOTIFICATION">Notification</option>
						</select>
					</div>
					<InputField value={`${listener.targetUrl}`} title='Target URL' name="TargetURL" errorMsg={errors.find(e => e.type == 'targetUrl')?.message} onChange={(e) => setData((d) => ({ ...d, targetUrl: e.target.value }))} autocomplete='off' />
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
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
					<button type="submit" className="btn btn-success">Save</button>
				</Modal.Footer>
			</form>
		</Modal>
	);
}