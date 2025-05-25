import React from 'react';
import { Chart as ChartJS,	CategoryScale, LinearScale, PointElement,	LineElement, Filler,	Tooltip, Legend, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatBytes } from '@/utils/functions';

ChartJS.register(CategoryScale,	LinearScale,	PointElement,	LineElement,	Filler,	Tooltip,	Legend);

type HourlyData = {
  [hour: string]: {
    incomingBytes: number;
    outgoingBytes: number;
  };
};

type Props = {
  data: HourlyData;
};

export function ActivityTransferAreaChart({ data }: Props) {
	const labels = Object.keys(data);
	const incomingData = labels.map(hour => data[hour].incomingBytes);
	const outgoingData = labels.map(hour => data[hour].outgoingBytes);

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
				position: 'top' as const,
			},
			tooltip: {
				callbacks: {
					label: (context) => {
						const label = context.dataset.label || '';
						const value = context.parsed.y;
						return `${label}: ${formatBytes(value)}`;
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

	return <div style={{ height: '400px' }}><Line data={chartData} options={options} /></div>;
};