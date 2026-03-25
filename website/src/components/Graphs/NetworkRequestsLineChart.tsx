import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import type { timeInterval } from '@/types';
import LineChart from '../Charts/Line';
import { ChartData } from 'chart.js';
import { Card } from '@/components';
import { useState } from 'react';
import API from '@/services/api';

interface Props {
	userId?: string
	storageId?: string
}

export default function NetworkRequestsLineChart({ userId, storageId }: Props) {
	const [requestGrowthInterval, setRequestGrowthInterval] = useState<timeInterval>('hourly');
	const { data, isLoading, error } = useQuery({
		queryKey: ['networkRequests', requestGrowthInterval, userId, storageId],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ interval: requestGrowthInterval });
			if (userId) params.append('userId', userId);
			if (storageId) params.append('storageId', storageId);

			return API.ADMIN.NETWORK.fetchNetworkRequestGrowth(signal, params);
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
						{requestGrowthInterval}
					</button>
					<ul className="dropdown-menu dropdown-menu-end">
						<li><a className="dropdown-item" href="#" onClick={() => setRequestGrowthInterval('yearly')}>Yearly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setRequestGrowthInterval('monthly')}>Monthly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setRequestGrowthInterval('daily')}>Daily</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setRequestGrowthInterval('hourly')}>Hourly</a></li>
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