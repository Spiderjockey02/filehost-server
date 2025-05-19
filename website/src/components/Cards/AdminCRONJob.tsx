import { faQuestion, faCheck, faX, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminCRONJobLogsModal } from '../Modals/AdminCRONJobLogsModal';
import Table from '../UI/Table';
import { useEffect, useState } from 'react';
import { CronJob } from '@prisma/client';

export function AdminCRONJobCard() {
	const [jobs, setJobs] = useState<CronJob[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Fetch recent files
		(async () => {
			try {
				const res = await fetch('/api/admin/cron-jobs');
				const { cronJobs } = await res.json();
				setJobs(cronJobs);
				setIsLoading(false);
			} catch (err) {
				console.error(err);
			}
		})();
	}, []);

	async function runCronJob(name: string) {
		try {
			await fetch(`/api/admin/cron-jobs/${name}`, {
				method: 'POST',
			});
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<div className="card shadow mb-4">
			<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
				<h4 className="m-0 fw-bold">CRON Jobs</h4>
			</div>
			<div className="card-body table-responsive">
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header className='text-center'>Latest Status</Table.Header>
						<Table.Header className='text-center'>Action</Table.Header>
						<Table.Header className='text-center'>Info</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{isLoading ? (
							[0, 0, 0, 0].map((_, index) => (
								<tr key={index}>
									<td className="placeholder-glow">
										<span className="placeholder col-12"></span>
									</td>
									<td className="placeholder-glow">
										<span className="placeholder col-12"></span>
									</td>
									<td className="placeholder-glow">
										<span className="placeholder col-12"></span>
									</td>
									<td className="placeholder-glow">
										<span className="placeholder col-12"></span>
									</td>
								</tr>
							))
						) : (
							jobs.map(job => (
								<tr key={job.name}>
									<td>{job.name}</td>
									<td className='text-center' style={{ color: job.latestStatus == null ? 'grey' : job.latestStatus == 'SUCCESS' ? 'green' : 'red' }}>
										<FontAwesomeIcon size='lg' icon={job.latestStatus == null ? faQuestion : job.latestStatus == 'SUCCESS' ? faCheck : faX } />
									</td>
									<td className='text-center'>
										<button className='btn btn-secondary btn-sm' onClick={() => runCronJob(job.name)}>
                    Re-run
										</button>
									</td>
									<td className='text-center'>
										<button className='btn' data-bs-toggle="modal" data-bs-target={`#${job.name}`}>
											<FontAwesomeIcon size='lg' icon={faCircleInfo} />
										</button>
									</td>
								</tr>
							))
						)}
					</Table.Body>
				</Table>
				{jobs.map((job) => <AdminCRONJobLogsModal CRONJob={job} key={job.name} />)}
			</div>
		</div>
	);
}