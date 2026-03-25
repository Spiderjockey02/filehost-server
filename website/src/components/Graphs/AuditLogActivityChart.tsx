import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import type { timeInterval } from '@/types';
import { Line } from 'react-chartjs-2';
import { Card } from '@/components';
import { useState } from 'react';
import API from '@/services/api';

export default function AuditLogActivityChart() {
	const [trafficGrowthInterval, setTrafficGrowthInterval] = useState<timeInterval>('daily');

	const { data, isLoading, error } = useQuery({
		queryKey: ['auditLogActivity', trafficGrowthInterval],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ interval: trafficGrowthInterval });
			return API.ADMIN.LOGS.fetchAuditLogActivity(signal, params);
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
		data: labels.map(hour => data?.[hour]?.[key as keyof typeof data[typeof hour]] ?? 0),
		backgroundColor: `rgba(${color}, 0.2)`,
		borderColor: `rgba(${color}, 1)`,
	}));

	return (
		<Card className='mb-4'>
			<Card.Header>
        Audit Log Activity Over Time
				<div className="dropdown">
					<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						{trafficGrowthInterval}
					</button>
					<ul className="dropdown-menu dropdown-menu-end">
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthInterval('yearly')}>Yearly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthInterval('monthly')}>Monthly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthInterval('daily')}>Daily</a></li>
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