import type { requestTimeFrames } from '@/types/pages';
import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import LineChart from '../Charts/Line';
import { Card } from '@/components';
import { useState } from 'react';
import API from '@/services/api';

export default function AdminCustomerTrend() {
	const [trafficGrowthFrame, setTrafficGrowthFrame] = useState<requestTimeFrames>('daily');

	const { data, isLoading, error } = useQuery({
		queryKey: ['customerTrends', trafficGrowthFrame],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ frame: trafficGrowthFrame });
			return API.ADMIN.fetchCustomerTrends(signal, params);
		},
		...queryOptions,
	});

	const fileUploadData = {
		labels: Object.keys(data ?? {}),
		datasets: [
			{
				label: 'subscriptions',
				data: Object.values(data ?? {}) as number[],
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

	return (
		<Card className='mb-4'>
			<Card.Header>
        Monthly Revenue Trend
				<div className="dropdown">
					<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						{trafficGrowthFrame}
					</button>
					<ul className="dropdown-menu dropdown-menu-end">
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthFrame('yearly')}>Yearly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthFrame('monthly')}>Monthly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthFrame('daily')}>Daily</a></li>
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
					<LineChart data={fileUploadData} options={{ responsive: true, maintainAspectRatio: false, aspectRatio:2 }} style={{ height: '400px' }} />
				)}
			</Card.Body>
		</Card>
	);
}