import { requestTimeFrames } from '@/types/pages';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import LineChart from '../Charts/Line';
import { ChartData } from 'chart.js';
import { Card } from '@/components';
import { useState } from 'react';

export default function NetworkRequestsLineChart() {
	const [requestGrowthFrame, setRequestGrowthFrame] = useState<requestTimeFrames>('hourly');
	const { data, isLoading, error } = useQuery({
		queryKey: ['networkRequests', requestGrowthFrame],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/network/requests?frame=${requestGrowthFrame}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch network requests: ${res.statusText}`);

			const d = await res.json();
			return d[Object.keys(d)[0]];
		},
		...queryOptions,
	});


	const RequestsOverTimeData = {
		labels: Object.keys(data ?? {}),
		datasets: [
			{
				label: 'Activities',
				data: Object.values(data ?? {}),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	} as ChartData<'line'>;

	return (
		<Card>
			<Card.Header>
        Requests over time
				<div className="dropdown">
					<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						{requestGrowthFrame}
					</button>
					<ul className="dropdown-menu dropdown-menu-end">
						<li><a className="dropdown-item" href="#" onClick={() => setRequestGrowthFrame('yearly')}>Yearly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setRequestGrowthFrame('monthly')}>Monthly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setRequestGrowthFrame('daily')}>Daily</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setRequestGrowthFrame('hourly')}>Hourly</a></li>
					</ul>
				</div>
			</Card.Header>
			<Card.Body>
				{isLoading ? (
					<div className="placeholder-glow" style={{ height: '400px', width: '100%' }}>
						<span	className="placeholder col-10 my-1"	style={{ height: '400px', borderRadius: '0.25rem', width: '100%' }}></span>
					</div>
				) : error ? (
					<div className="alert alert-danger" role="alert">
						{error.message}
					</div>
				) : (
					<LineChart data={RequestsOverTimeData} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
				)}
			</Card.Body>
		</Card>
	);
}