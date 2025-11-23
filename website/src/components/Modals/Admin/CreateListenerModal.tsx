import type { BaseModalProps } from '@/types/Components/Modals';
import type { AuditListenerFormError } from '@/types/errors';
import { useToast } from '@/components/Hooks/ToastManager';
import { AuditLogEventName } from '@prisma/client';
import SelectField from '../../Form/SelectField';
import InputField from '../../Form/InputField';
import { FormEvent, useState } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';

export default function AdminCreateListenerModal({ onClose, show } : BaseModalProps) {
	const typeOptions = [{ value: 'WEBHOOK', label: 'Webhook' }, { value: 'NOTIFICATION', label: 'Notification' }];
	const [errors, setErrors] = useState<AuditListenerFormError[]>([]);
	const { showToast } = useToast();
	const [data, setData] = useState({
		name: '',
		type: 'WEBHOOK',
		targetUrl: '',
		events: [] as string[],
	});

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();

		// Check errors
		const tempErrors: AuditListenerFormError[] = [];
		if (data.name.trim().length == 0) tempErrors.push({ type: 'name', message: 'This field is missing.' });
		if (data.type == 'WEBHOOK' && data.targetUrl.trim().length == 0) tempErrors.push({ type: 'targetUrl', message: 'This field is missing.' });
		if (data.events.length == 0) tempErrors.push({ type: 'events', message: 'This field is missing.' });
		if (tempErrors.length > 0) return setErrors(tempErrors);

		try {
			await axios.post('/api/admin/logs/listeners', data);
			showToast('success', 'The audit log listener was created successfully!');
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while creating the log listener.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
		}
	};

	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>Add New Audit Log Listener</Modal.Title>
			</Modal.Header>
			<form onSubmit={onSubmit}>
				<Modal.Body>
					<InputField title='Name' name="Name" onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} autocomplete='off' errorMsg={errors.find(e => e.type == 'name')?.message} />
					<SelectField title="Type" name="ListenerType" options={typeOptions} onChange={(e) => setData((d) => ({ ...d, type: e.target.value }))} />
					<InputField title='Target URL (Optional)' name="TargetURL" onChange={(e) => setData((d) => ({ ...d, targetUrl: e.target.value }))} autocomplete='off' errorMsg={errors.find(e => e.type == 'targetUrl')?.message} />
					<div className='mb-3'>
						<label className="form-label">Events:</label>
						<Select isMulti
							options={Object.keys(AuditLogEventName).map((v) => ({ value: v, label: v }))} onChange={(inputValue) => setData((d) => ({ ...d, events: inputValue.map((v) => v.value) }))}
						/>
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
