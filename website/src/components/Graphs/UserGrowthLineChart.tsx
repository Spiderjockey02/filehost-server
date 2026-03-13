import type { timeInterval } from '@/types/pages';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import LineChart from '../Charts/Line';
import { Card } from '@/components';
import { useState } from 'react';
import API from '@/services/api';

export default function UserGrowthLineChart() {
	const [userGrowthFrame, setUserGrowthFrame] = useState<timeInterval>('monthly');

	const { data, isLoading, error } = useQuery({
		queryKey: ['userGrowth', userGrowthFrame],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ interval: userGrowthFrame });
			return API.ADMIN.fetchUserGrowth(signal, params);
		},
		...queryOptions,
	});

	const userJoinData = {
		labels: Object.keys(data ?? {}),
		datasets: [
			{
				label: 'User Count',
				data: Object.values(data ?? {}),
				borderColor: 'rgb(75, 192, 192)',
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
			},
		],
	};

	return (
		<Card className='mb-4'>
			<Card.Header>
				User Growth Over Time
				<div className="dropdown">
					<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						{userGrowthFrame.charAt(0).toUpperCase() + userGrowthFrame.slice(1)}
					</button>
					<ul className="dropdown-menu dropdown-menu-end">
						<li><a className="dropdown-item" href="#" onClick={() => setUserGrowthFrame('daily')}>Daily</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setUserGrowthFrame('monthly')}>Monthly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setUserGrowthFrame('yearly')}>Yearly</a></li>
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
					<LineChart
						data={userJoinData}
						options={{ responsive: true, maintainAspectRatio: false, aspectRatio: 2 }}
						style={{ height: '400px' }}
					/>
				)}
			</Card.Body>
		</Card>
	);
}
