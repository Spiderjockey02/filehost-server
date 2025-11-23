import type { AdminBanUserModalProps } from '@/types/Components/Modals';
import { useToast } from '@/components/Hooks/ToastManager';
import type { BanUserFormError } from '@/types/errors';
import { FormEvent, useState } from 'react';
import { InputField } from '@/components';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

export default function AdminBanUserModal({ userId, show, onClose }: AdminBanUserModalProps) {
	const [errors, setErrors] = useState<BanUserFormError[]>([]);
	const { showToast } = useToast();
	const [data, setData] = useState({
		expiresAt: new Date(),
		reason: '',
	});

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();

		// Check for errors
		const tempErrors: BanUserFormError[] = [];
		if (data.reason.trim().length == 0) tempErrors.push({ type: 'reason', message: 'This field is missing.' });
		if (data.expiresAt.getTime() < new Date().getTime()) tempErrors.push({ type: 'expiresAt', message: 'This field must be in the future.' });
		if (tempErrors.length > 0) return setErrors(tempErrors);

		try {
			await axios.post(`/api/admin/users/${userId}/ban`, {
				...data,
				userId,
			});
			showToast('success', 'The user has been banned successfully');
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while sending the notification.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
		}
	};

	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>
          Ban user
				</Modal.Title>
			</Modal.Header>
			<form onSubmit={onSubmit}>
				<Modal.Body>
					<InputField title="Reason" name="Reason" onChange={(e) => setData({ ...data, reason: e.target.value })} errorMsg={errors.find(e => e.type == 'reason')?.message} />
					<InputField title="Expires At" name="ExpiresAt" type="datetime-local" onChange={(e) => setData({ ...data, expiresAt: new Date(e.target.value) })} errorMsg={errors.find(e => e.type == 'expiresAt')?.message} />
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
					<button type="submit" className="btn btn-success">Save</button>
				</Modal.Footer>
			</form>
		</Modal>
	);
}