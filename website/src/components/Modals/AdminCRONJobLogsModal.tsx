import type { CronJobLog } from '@prisma/client';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import Table from '../UI/Table';
import { faCheck, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AdminCRONJobLogsModalProps } from '@/types/Components/Modals';
import InputField from '../Form/InputField';

export function AdminCRONJobLogsModal({ CRONJob, onClickRun }: AdminCRONJobLogsModalProps) {
	const elementRef = useRef(null);
	const [logs, setLogs] = useState<CronJobLog[]>([]);
	const [schedule, setSchedule] = useState(CRONJob.schedule);

	async function updateSchedule() {
		try {
			await axios.post(`/api/admin/cron-jobs/${CRONJob.name}`, { schedule });
		} catch (err) {
			console.log(err);
		}
	}

	useEffect(() => {
		const targetElement = elementRef.current;
		if (!targetElement) return;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if ((mutation.target as HTMLDivElement).className.includes('show')) {
					axios.get(`/api/admin/cron-jobs/${CRONJob.name}/logs`).then(({ data }) => {
						setLogs(data.logs);
					});
				}
			});
		});

		// Start observing the target element for class changes
		observer.observe(targetElement, { attributes: true, attributeFilter: ['class'] });

		// Cleanup the observer on component unmount
		return () => observer.disconnect();
	}, [CRONJob.name]);

	return (
		<div className="modal fade" ref={elementRef} id={`${CRONJob.name}`} role="dialog" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '30vw' }}>
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title" id="exampleModalLongTitle">CRON logs for: {CRONJob.name}</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body" style={{ padding: '0' }}>
						<div style={{ padding: '5px' }}>
							<InputField title={'Schedule'} name={'schedule'} placeholder={schedule} onChange={(e) => setSchedule(e.target.value)} />
							<div className='d-flex justify-content-end'>
								<button className="btn btn-secondary" onClick={() => onClickRun()}>Re-run</button>
								&nbsp;
								<button className="btn btn-success" onClick={updateSchedule}>Save</button>
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
									{logs.sort((a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime()).map((job) => (
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
									))}
								</Table.Body>
							</Table>
						</div>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>
	);
}