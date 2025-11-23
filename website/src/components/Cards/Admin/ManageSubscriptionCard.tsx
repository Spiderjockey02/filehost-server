import { generatePlaceholderTable, formatBytes, queryOptions } from '@/utils/functions';
import { AdminEditPlanModal, AdminCreatePlanModal } from '@/components/Modals';
import { faAdd, faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Table, Card } from '@/components';
import { Plan } from '@prisma/client';
import { useState } from 'react';

export default function AdminManageSubscriptionCard() {
	const [activeModal, setActiveModal] = useState<string | null>(null);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['plans'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/plans', { signal });
			if (!res.ok) throw new Error(`Failed to fetch plans: ${res.statusText}`);

			const d = await res.json();
			return d as { plans: Plan[] };
		},
		...queryOptions,
	});

	return (
		<>
			<Card>
				<Card.Header>
					Plans
					<button className='btn btn-success' onClick={() => setActiveModal('newPlan')}>
						<FontAwesomeIcon icon={faAdd} />
						Plan
					</button>
				</Card.Header>
				<Card.Body className='table-responsive'>
					<Table>
						<Table.HeaderRow>
							<Table.Header>Name</Table.Header>
							<Table.Header>Max storage</Table.Header>
							<Table.Header>Max file</Table.Header>
							<Table.Header>File rentention</Table.Header>
							<Table.Header>Price</Table.Header>
							<Table.Header className='text-center'>Edit</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{error == null ?
								isLoading || data == null ?
									generatePlaceholderTable(5, 6)
									:	data.plans.map((plan) => (
										<tr key={plan.id}>
											<td>{plan.name}</td>
											<td>{formatBytes(plan.maxStorageSize)}</td>
											<td>{formatBytes(plan.maxFileSize)}</td>
											<td>{plan.deletedFileRetentionDays} days</td>
											<td>{`${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL}${plan.price}`}</td>
											<td className='text-center'>
												<button className='btn' onClick={() => setActiveModal(plan.id)} style={{ padding: '0' }}>
													<FontAwesomeIcon size='lg' icon={faPen} />
												</button>
											</td>
										</tr>
									))
								:
								<tr>
									<td colSpan={5} className="text-center text-danger fw-bold">
										{error?.message ?? 'Failed to load plans'}
									</td>
								</tr>
							}
						</Table.Body>
					</Table>
				</Card.Body>
			</Card>
			{activeModal !== null && activeModal !== 'newPlan' && data && <AdminEditPlanModal refresh={refetch} plan={data.plans.find(p => p.id == activeModal)!} show={true} onClose={() => setActiveModal(null)} />}
			{activeModal == 'newPlan' && <AdminCreatePlanModal refresh={refetch} show={true} onClose={() => setActiveModal(null)} />}
		</>
	);
}