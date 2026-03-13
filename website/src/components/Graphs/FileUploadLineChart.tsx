import type { AdminManageUsersCardProps } from '@/types/Components/Card';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import type { timeInterval } from '@/types';
import LineChart from '../Charts/Line';
import { Card } from '@/components';
import { useState } from 'react';
import API from '@/services/api';

export default function FileUploadLineChart({ storageId }: AdminManageUsersCardProps) {
	const [uploadGrowthInterval, setUploadGrowthInterval] = useState<timeInterval>('daily');

	const { data, isLoading, error } = useQuery({
		queryKey: storageId ? ['fileUploads', uploadGrowthInterval, storageId] : ['fileUploads', uploadGrowthInterval],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ interval: uploadGrowthInterval });
			if (storageId) params.append('storageId', storageId);

			return API.ADMIN.fetchFileUploadGrowth(signal, params);
		},
		...queryOptions,
	});

	const fileUploadData = {
		labels: Object.keys(data ?? {}),
		datasets: [
			{
				label: 'Total files uploaded',
				data: Object.values(data ?? {}),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
		],
	};

	return (
		<Card className='mb-4'>
			<Card.Header>
				File Uploads Over Time
				<div className="dropdown">
					<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						{uploadGrowthInterval.charAt(0).toUpperCase() + uploadGrowthInterval.slice(1)}
					</button>
					<ul className="dropdown-menu dropdown-menu-end">
						<li><a className="dropdown-item" href="#" onClick={() => setUploadGrowthInterval('daily')}>Daily</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setUploadGrowthInterval('monthly')}>Monthly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setUploadGrowthInterval('yearly')}>Yearly</a></li>
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
