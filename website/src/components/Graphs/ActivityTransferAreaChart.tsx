import { Chart as ChartJS,	CategoryScale, LinearScale, PointElement,	LineElement, Filler,	Tooltip, Legend, ChartOptions } from 'chart.js';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { requestTimeFrames } from '@/types/pages';
import { formatBytes } from '@/utils/functions';
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Card } from '..';
ChartJS.register(CategoryScale,	LinearScale,	PointElement,	LineElement,	Filler,	Tooltip,	Legend);

export default function ActivityTransferAreaChart() {
	const [trafficGrowthFrame, setTrafficGrowthFrame] = useState<requestTimeFrames>('hourly');

	const { data, isLoading, error } = useQuery({
		queryKey: ['networkTraffic', trafficGrowthFrame],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/network/traffic?frame=${trafficGrowthFrame}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch activity transfer data: ${res.statusText}`);

			const d = await res.json();
			const firstKey = Object.keys(d)[0];
			return d[firstKey];
		},
		...queryOptions,
	});

	const labels = Object.keys(data ?? {});
	const incomingData = labels.map(hour => data[hour]?.incomingBytes ?? 0);
	const outgoingData = labels.map(hour => data[hour]?.outgoingBytes ?? 0);

	const chartData = {
		labels,
		datasets: [
			{
				label: 'Incoming Bytes',
				data: incomingData,
				fill: true,
				backgroundColor: 'rgba(54, 162, 235, 0.2)',
				borderColor: 'rgba(54, 162, 235, 1)',
				tension: 0.4,
			},
			{
				label: 'Outgoing Bytes',
				data: outgoingData,
				fill: true,
				backgroundColor: 'rgba(255, 99, 132, 0.2)',
				borderColor: 'rgba(255, 99, 132, 1)',
				tension: 0.4,
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top',
			},
			tooltip: {
				callbacks: {
					label: (context) => {
						const label = context.dataset.label || '';
						const value = context.parsed.y;
						return `${label}: ${formatBytes(value || 0)}`;
					},
				},
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					callback: (value) => `${formatBytes(Number(value))}`,
				},
			},
		},
	} as ChartOptions<'line'>;

	return (
		<Card>
			<Card.Header>
				Traffic over time
				<div className="dropdown">
					<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						{trafficGrowthFrame}
					</button>
					<ul className="dropdown-menu dropdown-menu-end">
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthFrame('yearly')}>Yearly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthFrame('monthly')}>Monthly</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthFrame('daily')}>Daily</a></li>
						<li><a className="dropdown-item" href="#" onClick={() => setTrafficGrowthFrame('hourly')}>Hourly</a></li>
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
					<Line data={chartData} options={options} style={{ height: '400px' }} />
				)}
			</Card.Body>
		</Card>
	);
};