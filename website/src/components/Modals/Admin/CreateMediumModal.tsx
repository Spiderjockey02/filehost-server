import type { AdminCreateMediumModalProps } from '@/types/Components/Modals';
import { useToast } from '@/components/Hooks/ToastManager';
import type { MediumFormError } from '@/types/errors';
import { BaseSyntheticEvent, useState } from 'react';
import SelectField from '../../Form/SelectField';
import { Row, Col } from '@/components/UI/Grid';
import InputField from '../../Form/InputField';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

export default function AdminCreateMediumModal({ refreshTable, show, onClose }: AdminCreateMediumModalProps) {
	const storageTypes = [{ value: 'FILE_SYSTEM', label: 'Local' }, { value: 'SFTP', label: 'SFTP' }, { value: 'S3', label: 'S3' }];
	const [errors, setErrors] = useState<MediumFormError[]>([]);
	const { showToast } = useToast();
	const [storage, setStorage] = useState({
		name: '',
		basePath: '',
		location: '',
		maxSize: '',
		type: 'FILE_SYSTEM',
		endpoint: '',
		isPrivate: false,
	});

	async function onSubmit(e: BaseSyntheticEvent) {
		e.preventDefault();
		// Check errors
		const tempErrors: MediumFormError[] = [];
		if (storage.name.trim().length == 0) tempErrors.push({ type: 'name', message: 'This field is missing.' });
		if (storage.basePath.trim().length == 0) tempErrors.push({ type: 'basePath', message: 'This field is missing.' });
		if (storage.location.trim().length == 0) tempErrors.push({ type: 'location', message: 'This field is missing.' });
		if (storage.type !== 'FILE_SYSTEM' && storage.endpoint.trim().length == 0) tempErrors.push({ type: 'endpoint', message: 'This field is missing.' });
		if (storage.maxSize.trim().length == 0) tempErrors.push({ type: 'maxSize', message: 'This field is missing.' });
		if (tempErrors.length > 0) return setErrors(tempErrors);

		try {
			await axios.post('/api/admin/storage', storage);
			await refreshTable();
			showToast('success', 'The storage medium was created successfully!');
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while creating storage medium.';
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
          Add New Storage Medium
				</Modal.Title>
			</Modal.Header>
			<form onSubmit={onSubmit}>
				<Modal.Body>
					<Row>
						<Col md={6}>
							<InputField title='Name' name="name" errorMsg={errors.find(e => e.type == 'name')?.message} autocomplete='off' onChange={(e) => setStorage((s) => ({ ...s, name: e.target.value }))} />
							<InputField title='Location' name="Location" placeholder="Europe" errorMsg={errors.find(e => e.type == 'location')?.message} onChange={(e) => setStorage((s) => ({ ...s, location: e.target.value }))} />
						</Col>
						<Col md={6}>
							<SelectField title="Type" name="storageType" options={storageTypes} onChange={(e) => setStorage((s) => ({ ...s, type: e.target.value }))} />
							<InputField title='Max Size (GB)' name="Max Size (GB)" type="number" errorMsg={errors.find(e => e.type == 'maxSize')?.message} onChange={(e) => setStorage((s) => ({ ...s, maxSize: e.target.value }))} />
						</Col>
						<InputField title='Base Path' name="Base Path" placeholder="/storage/medium1" errorMsg={errors.find(e => e.type == 'basePath')?.message} onChange={(e) => setStorage((s) => ({ ...s, basePath: e.target.value }))} />
						{storage.type !== 'FILE_SYSTEM' &&
								<InputField title='Endpoint (Optional)' name="Endpoint" placeholder={`${storage.type.toLowerCase()}://`} errorMsg={errors.find(e => e.type == 'endpoint')?.message} onChange={(e) => setStorage((s) => ({ ...s, endpoint: e.target.value }))} />
						}
					</Row>
					<hr />
					<div className="form-check mb-3">
						<input className="form-check-input" type="checkbox" id="isPrivate" onChange={(e) => setStorage((s) => ({ ...s, isPrivate: e.target.checked }))} />
						<label className="form-check-label" htmlFor="isPrivate">
							Private only
						</label>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
					<button type="submit" className="btn btn-success">Create</button>
				</Modal.Footer>
			</form>
		</Modal>
	);
}
