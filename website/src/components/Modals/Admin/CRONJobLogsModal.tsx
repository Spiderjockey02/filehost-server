import { faCheck, faRedoAlt, faSave, faX } from '@fortawesome/free-solid-svg-icons';
import type { AdminCRONJobLogsModalProps } from '@/types/Components/Modals';
import { generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { CronJobLog } from '@/types/generated/browser';
import { Table, InputField } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { Modal } from 'react-bootstrap';
import { useState } from 'react';
import axios from 'axios';

export default function AdminCRONJobLogsModal({ CRONJob, onClose, refetch, show }: AdminCRONJobLogsModalProps) {
	const [schedule, setSchedule] = useState(CRONJob.schedule);
	const { data, isLoading, error, refetch: refreshLog } = useQuery({
		queryKey: ['CRONJon', CRONJob.name],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/cron-jobs/${CRONJob.name}/logs`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch CRON job logs: ${res.statusText}`);

			const d = await res.json();
			return d as { logs: CronJobLog[], total: number };
		},
		...queryOptions,
	});

	async function updateSchedule() {
		try {
			await axios.post(`/api/admin/cron-jobs/${CRONJob.name}`, { schedule });
		} catch (err) {
			console.log(err);
		}
	}

	async function runCronJob(name: string) {
		try {
			await fetch(`/api/admin/cron-jobs/${name}/run`, {
				method: 'POST',
			});
			refetch();
			await refreshLog();
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<Modal show={show} onHide={onClose} centered dialogClassName='modal-30w'>
			<Modal.Header closeButton>
				<Modal.Title>CRON Job: {CRONJob.name}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div className="p-3 mb-4 rounded bg-light border">
					<h6 className="fw-semibold mb-3 text-secondary">Update Schedule</h6>
					<div className="d-flex align-items-center gap-2">
						<div className="flex-grow-1">
							<InputField title="CRON Schedule" name="schedule" placeholder={schedule} onChange={(e) => setSchedule(e.target.value)} />
						</div>
						<div className="d-flex gap-2 pt-3">
							<button className="btn btn-outline-secondary" onClick={() => runCronJob(CRONJob.name)} title="Re-run this CRON job manually">
								<FontAwesomeIcon icon={faRedoAlt} className="me-1" />
								Re-run
							</button>
							<button className="btn btn-success" onClick={updateSchedule} title="Save the new CRON schedule">
								<FontAwesomeIcon icon={faSave} className="me-1" />
								Save
							</button>
						</div>
					</div>
				</div>
				<div className="table-responsive" style={{ maxHeight: '50vh', overflowY: 'scroll' }}>
					<Table>
						<Table.HeaderRow>
							<Table.Header>ID</Table.Header>
							<Table.Header className='text-center'>Status</Table.Header>
							<Table.Header className='text-center'>Message</Table.Header>
							<Table.Header className='text-center'>Duration</Table.Header>
							<Table.Header className='text-center'>Ran at</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{error == null ?
								isLoading || data == null ?
									generatePlaceholderTable(20, 5)
									: data.logs.sort((a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime()).map((job) => (
										<tr key={job.id}>
											<td>{job.id}</td>
											<td className='text-center' style={{ color: job.status == 'SUCCESS' ? 'green' : 'red' }}>
												<FontAwesomeIcon size='lg' icon={job.status == 'SUCCESS' ? faCheck : faX } />
											</td>
											<td>
												{job.message}
											</td>
											<td>
												{job.duration}ms
											</td>
											<td>
												{new Date(job.ranAt).toLocaleString()}
											</td>
										</tr>
									))
								:
								<tr>
									<td colSpan={5} className="text-center text-danger fw-bold">
										{error?.message ?? 'Failed to fetch CRON job logs.'}
									</td>
								</tr>
							}
						</Table.Body>
					</Table>
				</div>
			</Modal.Body>
		</Modal>
	);
}