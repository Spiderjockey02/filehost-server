import { faQuestion, faCheck, faX, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { AdminCRONJobLogsModal } from '../Modals/AdminCRONJobLogsModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';
import { CronJob } from '@prisma/client';

export function AdminCRONJobCard() {
	const { data, isLoading, refetch, error } = useQuery({
		queryKey: ['cronJobs'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/admin/cron-jobs', { signal });
			if (!res.ok) throw new Error(`Failed to fetch CRON jobs: ${res.statusText}`);

			const d = await res.json();
			return d as { cronJobs: CronJob[] };
		},
		...queryOptions,
	});

	async function runCronJob(name: string) {
		try {
			await fetch(`/api/admin/cron-jobs/${name}/run`, {
				method: 'POST',
			});
			await refetch();
		} catch (err) {
			console.log(err);
		}
	}

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
							isLoading || data == null ? (
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
									</tr>
								))
							) : (
								data.cronJobs.map(job => (
									<tr key={job.name}>
										<td>{job.name}</td>
										<td className='text-center' style={{ color: job.latestStatus == null ? 'grey' : job.latestStatus == 'SUCCESS' ? 'green' : 'red' }}>
											<FontAwesomeIcon size='lg' icon={job.latestStatus == null ? faQuestion : job.latestStatus == 'SUCCESS' ? faCheck : faX } />
										</td>
										<td className='text-center'>
											<button className='btn' data-bs-toggle="modal" data-bs-target={`#${job.name}`}>
												<FontAwesomeIcon size='lg' icon={faCircleInfo} />
											</button>
										</td>
									</tr>
								))
							) :
							<tr>
								<td colSpan={5} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to load CRON jobs'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				{data?.cronJobs.map((job) => <AdminCRONJobLogsModal CRONJob={job} key={job.name} onClickRun={() => runCronJob(job.name)} />)}
			</Card.Body>
		</Card>
	);
}