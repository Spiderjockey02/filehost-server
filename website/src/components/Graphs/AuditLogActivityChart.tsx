import { requestTimeFrames } from '@/types/pages';
import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import { Card } from '@/components';
import { useState } from 'react';

export default function AuditLogActivityChart() {
	const [trafficGrowthFrame, setTrafficGrowthFrame] = useState<requestTimeFrames>('daily');

	const { data, isLoading, error } = useQuery({
		queryKey: ['auditLogActivity', trafficGrowthFrame],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/logs/history?frame=${trafficGrowthFrame}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch audit log activity data: ${res.statusText}`);

			const d = await res.json();
			const firstKey = Object.keys(d)[0];
			return d[firstKey];
		},
		...queryOptions,
	});

	const labels = Object.keys(data ?? {});

	const config = [
		{ key: 'user', label: 'User Events', color: '54, 162, 235' },
		{ key: 'file', label: 'File Events', color: '255, 99, 132' },
		{ key: 'storage', label: 'Storage Events', color: '75, 192, 192' },
		{ key: 'system', label: 'System Events', color: '255, 206, 86' },
		{ key: 'session', label: 'Session Events', color: '153, 102, 255' },
	];

	const datasets = config.map(({ key, label, color }) => ({
		label,
		data: labels.map(hour => data[hour]?.[key] ?? 0),
		backgroundColor: `rgba(${color}, 0.2)`,
		borderColor: `rgba(${color}, 1)`,
	}));

	return (
		<Card className='mb-4'>
			<Card.Header>
        Audit Log Activity Over Time
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
					<Line data={{ labels, datasets }} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '400px' }} />
				)}
			</Card.Body>
		</Card>
	);
}