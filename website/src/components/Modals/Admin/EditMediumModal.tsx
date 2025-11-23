import type { AdminEditStorageModalProps } from '@/types/Components/Modals';
import { useToast } from '@/components/Hooks/ToastManager';
import { MediumFormError } from '@/types/errors';
import type { BaseSyntheticEvent } from 'react';
import InputField from '../../Form/InputField';
import { Modal } from 'react-bootstrap';
import { useState } from 'react';
import axios from 'axios';

export default function AdminEditStorageModal({ storage, refreshTable, show, onClose }: AdminEditStorageModalProps) {
	const [errors, setErrors] = useState<MediumFormError[]>([]);
	const { showToast } = useToast();
	const [data, setData] = useState({
		name: storage.name,
		maxSize: storage.maxSize / (1024 ** 3),
		isPrivate: storage.isPrivate,
	});

	async function onSubmit(e: BaseSyntheticEvent) {
		e.preventDefault();

		// Check errors
		const tempErrors: MediumFormError[] = [];
		if (data.name.trim().length == 0) tempErrors.push({ type: 'name', message: 'This field is missing.' });
		if (data.maxSize == 0) tempErrors.push({ type: 'maxSize', message: 'This field is missing.' });
		if (tempErrors.length > 0) return setErrors(tempErrors);

		try {
			await axios.post(`/api/admin/storage/${storage.id}`, {
				...data,
			});
			await refreshTable();
			showToast('success', 'The storage medium was edited successfully!');
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while editing the storage medium.';
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
          Edit storage: {storage.name}
				</Modal.Title>
			</Modal.Header>
			<form onSubmit={onSubmit}>
				<Modal.Body>
					<InputField title="Name" name="name" value={storage.name} autocomplete='off' onChange={(e) => setData({ ...data, name: e.target.value })} errorMsg={errors.find(e => e.type == 'name')?.message} />
					<InputField title="Max Bytes (GB)" name="Max Bytes (GB)" type='number' value={`${data.maxSize}`} onChange={(e) => setData({ ...data, maxSize: Number(e.target.value) })} errorMsg={errors.find(e => e.type == 'maxSize')?.message} />
					<div className="form-check">
						<input className="form-check-input" type="checkbox" defaultChecked={storage.isPrivate} id="checkDefault" />
						<label className="form-check-label" htmlFor="checkDefault" onClick={() => setData({ ...data, isPrivate: !data.isPrivate })}>
							Is Private
						</label>
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