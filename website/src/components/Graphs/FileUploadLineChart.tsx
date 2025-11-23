import type { AdminManageUsersCardProps } from '@/types/Components/Card';
import type { requestTimeFrames } from '@/types/pages';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import type { StringNumberObj } from '@/types';
import LineChart from '../Charts/Line';
import { Card } from '@/components';
import { useState } from 'react';

export default function FileUploadLineChart({ storageId }: AdminManageUsersCardProps) {
	const [uploadGrowthFrame, setUploadGrowthFrame] = useState<requestTimeFrames>('daily');

	const { data, isLoading, error } = useQuery({
		queryKey: storageId ? ['fileUploads', uploadGrowthFrame, storageId] : ['fileUploads', uploadGrowthFrame],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/files/growth?frame=${uploadGrowthFrame}${storageId ? `&storageId=${storageId}` : ''}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch file upload trend: ${res.statusText}`);
			const d = await res.json();
			const firstKey = Object.keys(d)[0];
			return d[firstKey] as StringNumberObj;
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
						{uploadGrowthFrame.charAt(0).toUpperCase() + uploadGrowthFrame.slice(1)}
					</button>
					<ul className="dropdown-menu dropdown-menu-end">
						<li><a className="dropdown-item" href="#" onClick={() => setUploadGrowthFrame('daily')}>Daily</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setUploadGrowthFrame('monthly')}>Monthly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setUploadGrowthFrame('yearly')}>Yearly</a></li>
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
