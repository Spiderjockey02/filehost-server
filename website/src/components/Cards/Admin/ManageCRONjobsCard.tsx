import { faQuestion, faCheck, faX, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminCRONJobLogsModal } from '@/components/Modals';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';
import { useState } from 'react';
import API from '@/services/api';

export default function AdminManageCRONjobsCard() {
	const [activeModal, setActiveModal] = useState<string | null>(null);

	const { data, isLoading, refetch, error } = useQuery({
		queryKey: ['cronJobs'],
		queryFn: async ({ signal }) => API.ADMIN.fetchCronJobs(signal),
		...queryOptions,
	});

	return (
		<Card className='mb-4'>
			<Card.Header>
				CRON Jobs
			</Card.Header>
			<Card.Body className='table-responsive'>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header className='text-center'>Latest Status</Table.Header>
						<Table.Header className='text-center'>Info</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || data == null ?
								generatePlaceholderTable(4, 3)
								: data.cronJobs.map(job => (
									<tr key={job.name}>
										<td>{job.name}</td>
										<td className='text-center' style={{ color: job.latestStatus == null ? 'grey' : job.latestStatus == 'SUCCESS' ? 'green' : 'red' }}>
											<FontAwesomeIcon size='lg' icon={job.latestStatus == null ? faQuestion : job.latestStatus == 'SUCCESS' ? faCheck : faX } />
										</td>
										<td className='text-center'>
											<button className='btn' onClick={() => setActiveModal(job.name)}>
												<FontAwesomeIcon size='lg' icon={faCircleInfo} />
											</button>
										</td>
									</tr>
								))
							:
							<tr>
								<td colSpan={5} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to load CRON jobs'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				{(activeModal && data) && <AdminCRONJobLogsModal show={true} CRONJob={data.cronJobs.find((a) => a.name === activeModal)!} onClose={() => setActiveModal(null)} refetch={refetch} />}
			</Card.Body>
		</Card>
	);
}