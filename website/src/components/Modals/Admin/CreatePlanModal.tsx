import type { AdminCreatePlanModalProps } from '@/types/Components/Modals';
import { useToast } from '@/components/Hooks/ToastManager';
import type { PlanFormError } from '@/types/errors';
import InputField from '../../Form/InputField';
import { FormEvent, useState } from 'react';
import { Col, Row } from '../../UI/Grid';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

export default function AdminCreatePlanModal({ refresh, show, onClose }: AdminCreatePlanModalProps) {
	const [errors, setErrors] = useState<PlanFormError[]>([]);
	const { showToast } = useToast();
	const [data, setData] = useState({
		name: '',
		price: '',
		maxStorageSize: '',
		maxFileSize: '',
		retentionDays: '',
		priceId: '',
	});

	const handleSubmit = async (e: FormEvent) => {
  	e.preventDefault();

  	const tempErrors: PlanFormError[] = [];
  	if (data.name.length == 0) tempErrors.push({ type: 'name', message: 'This field is missing.' });
  	if (data.price.length == 0) tempErrors.push({ type: 'price', message: 'This field is missing.' });
  	if (data.maxStorageSize.length == 0) tempErrors.push({ type: 'maxStorageSize', message: 'This field is missing.' });
  	if (data.maxFileSize.length == 0) tempErrors.push({ type: 'maxFileSize', message: 'This field is missing.' });
  	if (data.retentionDays.length == 0) tempErrors.push({ type: 'retentionDays', message: 'This field is missing.' });
  	if (data.priceId.length == 0) tempErrors.push({ type: 'priceId', message: 'This field is missing.' });
  	if (tempErrors.length > 0) return setErrors(tempErrors);

  	try {
  		await axios.post('/api/admin/plan', data);
  		refresh();
			showToast('success', 'The subscription plan was created successfully!');
  	} catch (err) {
  		if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while creating subscription plan.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
  	}
	};

	return (
  	<Modal show={show} onHide={onClose} centered>
  		<Modal.Header closeButton>
  			<Modal.Title>Create Subscription</Modal.Title>
  		</Modal.Header>
  		<form onSubmit={handleSubmit}>
  			<Modal.Body>
  				<Row className='g-3'>
  					<Col md={6}>
  						<InputField title="Name" name="planName" placeholder='Basic, Pro, etc.' onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} errorMsg={errors.find(e => e.type == 'name')?.message} />
  					</Col>
  					<Col md={6}>
  						<InputField title={`Price (${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL})`} name={`Price (${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL})`} type='number' step={0.01} onChange={(e) => setData((d) => ({ ...d, price: e.target.value }))} errorMsg={errors.find(e => e.type == 'price')?.message} />
  					</Col>
  					<Col md={6}>
  						<InputField title="Max Storage Size (GB)" name="Max Storage Size (GB)" type='number' placeholder='5' onChange={(e) => setData((d) => ({ ...d, maxStorageSize: e.target.value }))} errorMsg={errors.find(e => e.type == 'maxStorageSize')?.message} />
  					</Col>
  					<Col md={6}>
  						<InputField title="Max File Size (GB)" name="Max File Size (GB)" type='number' placeholder='2' onChange={(e) => setData((d) => ({ ...d, maxFileSize: e.target.value }))} errorMsg={errors.find(e => e.type == 'maxFileSize')?.message} />
  					</Col>
  					<Col md={6}>
  						<InputField title="Deleted File Retention (days)" name="Deleted File Retention (days)" type='number' placeholder='30' onChange={(e) => setData((d) => ({ ...d, retentionDays: e.target.value }))} errorMsg={errors.find(e => e.type == 'retentionDays')?.message} />
  					</Col>
  					<Col md={6}>
  						<InputField title="Stripe Price ID" name="Stripe Price ID" placeholder="price_XXXXXX" onChange={(e) => setData((d) => ({ ...d, priceId: e.target.value }))} errorMsg={errors.find(e => e.type == 'priceId')?.message} />
  					</Col>
  				</Row>
  			</Modal.Body>
  		</form>
  		<Modal.Footer>
  			<button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
  			<button type="submit" className="btn btn-primary">Save</button>
  		</Modal.Footer>
  	</Modal>
	);
}