import { CronJob, CronJobLog } from '@prisma/client';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import Table from '../UI/Table';
import { faCheck, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
  CRONJob: CronJob
}

export function AdminCRONJobLogsModal({ CRONJob }: Props) {
	const elementRef = useRef(null);
	const [logs, setLogs] = useState<CronJobLog[]>([]);

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
	}, []);

	return (
		<div className="modal fade" ref={elementRef} id={`${CRONJob.name}`} role="dialog" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title" id="exampleModalLongTitle">CRON logs for: {CRONJob.name}</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body table-responsive">
						<Table>
							<Table.HeaderRow>
								<Table.Header>ID</Table.Header>
								<Table.Header className='text-center'>Status</Table.Header>
								<Table.Header className='text-center'>Message</Table.Header>
								<Table.Header className='text-center'>Duration</Table.Header>
								<Table.Header className='text-center'>Ran at</Table.Header>
							</Table.HeaderRow>
							<Table.Body>
								{logs.map((job) => (
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
					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>
	);
}