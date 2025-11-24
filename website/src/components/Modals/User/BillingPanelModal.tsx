import type { BillingPanelModalProps } from '@/types/Components/Modals';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/Hooks/ToastManager';
import type { Plan } from '@/types/generated/browser';
import { formatBytes } from '@/utils/functions';
import { authClient } from '@/auth/client';
import { Col, Row } from '../../UI/Grid';
import { Modal } from 'react-bootstrap';

export default function BillingPanelModal({ show, onClose, currentPlan }: BillingPanelModalProps) {
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['plans'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/plans', { signal });
			if (!res.ok) throw new Error(`Failed to fetch recent activity: ${res.statusText}`);

			const d = await res.json();
			return d as { plans: Plan[] };
		},
		...queryOptions,
	});

	async function handleSubscription(plan: Plan) {
		try {
			const { data: response, error: resError } = await authClient.subscription.upgrade({
				plan: plan.name,
			});

			if (resError) return showToast('error', `${resError.message}`);
			console.log(response);
		} catch (err) {
			showToast('error', `${err}`);
		}
	}

	return (
		<Modal onHide={onClose} show={show} centered size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Select a New Plan</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{error == null ?
					isLoading || data == null ?
						<div className="py-5">
							<div className="spinner-border text-primary mb-3" role="status" />
							<div className="text-muted">Loading available plans...</div>
						</div>
						: <Row className="g-4">
							{data.plans.map((plan, index) => (
								<Col key={index} lg={Math.min(Math.floor(12 / data.plans.length), 6)} md={6} xs={12}>
									<div
										className={`p-4 border rounded-4 h-100 text-center shadow-sm hover-shadow transition-all ${
											currentPlan?.id === plan.id ? 'border-success shadow-lg' : 'border-light'
										}`}
										style={{
											cursor: currentPlan?.id === plan.id ? undefined : 'pointer',
											backgroundColor:
                    currentPlan?.id === plan.id ? 'rgba(25, 135, 84, 0.05)' : 'white',
										}}
									>
										<h4 className="fw-bold mb-2">{plan.name}</h4>
										<h5 className="text-primary mb-3">
											<sup className="fs-6 align-top">$</sup>
											{Number(plan.price).toFixed(2)}
											<span className="text-muted fs-6"> / month</span>
										</h5>

										<ul className="list-unstyled small mb-4">
											<li className="mb-1">
												<b>Storage:</b> {formatBytes(plan.maxStorageSize)}
											</li>
										</ul>

										<button
											className={`btn ${
												currentPlan?.id === plan.id
													? 'btn-success'
													: 'btn-outline-primary'
											} w-100`}
											onClick={() => handleSubscription(plan)}
										>
											{currentPlan?.id === plan.id ? 'Selected' : 'Choose Plan'}
										</button>
									</div>
								</Col>
							))}
						</Row>
					:
					<div className="py-5">
						<i className="bi bi-exclamation-triangle text-danger fs-1 mb-2" />
						<div className="text-danger fw-semibold mb-2">
            	Failed to load plans
						</div>
						<div className="text-muted small">
							{error.message || 'Something went wrong while fetching plan data.'}
						</div>
					</div>
				}
			</Modal.Body>
		</Modal>
	);
}