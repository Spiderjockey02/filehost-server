import { FormEvent, useState } from 'react';
import InputField from '../Form/InputField';
import { Col, Row } from '../UI/Grid';
import axios from 'axios';
import { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';
import { Plan } from '@prisma/client';

interface Props {
	refresh: (options?: RefetchOptions) => Promise<QueryObserverResult<{
    plans: Plan[];
	}, Error>>
}

export default function AdminAddNewPlanModal({ refresh }: Props) {
	const [data, setData] = useState({
		name: '',
		price: '',
		maxStorageSize: '',
		maxFileSize: '',
		retentionDays: '',
		priceId: '',
	});

  interface adsf {
    type: keyof typeof data | 'misc'
    text: string
  }

  const [errors, setErrors] = useState<adsf[]>([]);


  const handleSubmit = async (e: FormEvent) => {
  	e.preventDefault();

  	const tempErrors: adsf[] = [];
  	if (data.name.length == 0) tempErrors.push({ type: 'name', text: 'This field is missing.' });
  	if (data.price.length == 0) tempErrors.push({ type: 'price', text: 'This field is missing.' });
  	if (data.maxStorageSize.length == 0) tempErrors.push({ type: 'maxStorageSize', text: 'This field is missing.' });
  	if (data.maxFileSize.length == 0) tempErrors.push({ type: 'maxFileSize', text: 'This field is missing.' });
  	if (data.retentionDays.length == 0) tempErrors.push({ type: 'retentionDays', text: 'This field is missing.' });
  	if (data.priceId.length == 0) tempErrors.push({ type: 'priceId', text: 'This field is missing.' });
  	if (tempErrors.length > 0) return setErrors(tempErrors);

  	try {
  		await axios.post('/api/admin/plan', data);
  		refresh();
  	} catch (err) {
  		setErrors([{ type: 'misc', text: 'Failed to create plan' }]);
  		console.log(err);
  	}
  };

  return (
  	<div className="modal fade" id="AdminAddNewPlanModal" tabIndex={-1} aria-labelledby="planModalLabel" aria-hidden="true">
  		<div className="modal-dialog modal-dialog-centered modal-lg">
  			<div className="modal-content shadow-sm">
  				<div className="modal-header bg-light">
  					<h5 className="modal-title fw-bold" id="planModalLabel">Create new Plan</h5>
  					<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
  				</div>
  				<form onSubmit={handleSubmit}>
  					<div className="modal-body">
  						<Row className='g-3'>
  							<Col md={6}>
  								<InputField title="Name" name="planName" placeholder='Basic, Pro, etc.' onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} errorMsg={errors.find(e => e.type == 'name')?.text} />
  							</Col>
  							<Col md={6}>
  								<InputField title={`Price (${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL})`} name={`Price (${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL})`} type='number' step={0.01} onChange={(e) => setData((d) => ({ ...d, price: e.target.value }))} errorMsg={errors.find(e => e.type == 'price')?.text} />
  							</Col>
  							<Col md={6}>
  								<InputField title="Max Storage Size (GB)" name="Max Storage Size (GB)" type='number' placeholder='5' onChange={(e) => setData((d) => ({ ...d, maxStorageSize: e.target.value }))} errorMsg={errors.find(e => e.type == 'maxStorageSize')?.text} />
  							</Col>
  							<Col md={6}>
  								<InputField title="Max File Size (GB)" name="Max File Size (GB)" type='number' placeholder='2' onChange={(e) => setData((d) => ({ ...d, maxFileSize: e.target.value }))} errorMsg={errors.find(e => e.type == 'maxFileSize')?.text} />
  							</Col>
  							<Col md={6}>
                	<InputField title="Deleted File Retention (days)" name="Deleted File Retention (days)" type='number' placeholder='30' onChange={(e) => setData((d) => ({ ...d, retentionDays: e.target.value }))} errorMsg={errors.find(e => e.type == 'retentionDays')?.text} />
  							</Col>
  							<Col md={6}>
                	<InputField title="Stripe Price ID" name="Stripe Price ID" placeholder="price_XXXXXX" onChange={(e) => setData((d) => ({ ...d, priceId: e.target.value }))} errorMsg={errors.find(e => e.type == 'priceId')?.text} />
  							</Col>
  						</Row>
  					</div>
  					<div className="modal-footer">
  						<button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
  						<button type="submit" className="btn btn-primary">Save</button>
  					</div>
  				</form>
  			</div>
  		</div>
  	</div>
  );
}