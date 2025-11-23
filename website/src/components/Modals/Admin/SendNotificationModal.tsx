import type { AdminSendNotificationModalProps } from '@/types/Components/Modals';
import type { NotificationFormError } from '@/types/errors';
import { useToast } from '@/components/Hooks/ToastManager';
import InputField from '../../Form/InputField';
import { FormEvent, useState } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

export default function AdminSendNotificationModal({ userId, show, onClose }: AdminSendNotificationModalProps) {
	const [errors, setErrors] = useState<NotificationFormError[]>([]);
	const { showToast } = useToast();
	const [data, setData] = useState({
		text: '', title: '', url: '', userId,
	});

	async function onSubmit(e: FormEvent) {
		e.preventDefault();

		// Check errors
		const tempErrors: NotificationFormError[] = [];
		if (data.text.trim().length == 0) tempErrors.push({ type: 'text', text: 'This field is missing.' });
		if (data.title.trim().length == 0) tempErrors.push({ type: 'title', text: 'This field is missing.' });
		if (tempErrors.length > 0) return setErrors(tempErrors);

		try {
			await axios.post('/api/admin/notification', data);
			showToast('success', 'Your notification has been sent to the user');
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while sending the notification.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
		}
	}

	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>
          Send notification to user
				</Modal.Title>
			</Modal.Header>
			<form onSubmit={onSubmit}>
				<Modal.Body>
					<InputField title='Title' name="folder" errorMsg={errors.find(e => e.type == 'title')?.text} onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))} autocomplete='off' />
					<InputField title='Text' name="folder" errorMsg={errors.find(e => e.type == 'text')?.text} onChange={(e) => setData((d) => ({ ...d, text: e.target.value }))} autocomplete='off' />
					<InputField title='URL (Optional)' name="folder" errorMsg={errors.find(e => e.type == 'url')?.text} onChange={(e) => setData((d) => ({ ...d, url: e.target.value }))} autocomplete='off' />
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
					<button type="submit" className="btn btn-success">Send</button>
				</Modal.Footer>
			</form>
		</Modal>
	);
}