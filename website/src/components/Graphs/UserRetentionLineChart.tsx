import { ChartData, ChartOptions } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import LineChart from '../Charts/Line';
import API from '@/services/api';

export default function UserRetentionLineChart() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['userRentention'],
		queryFn: async ({ signal }) => {
			return API.ADMIN.USERS.fetchRetention(signal);
		},
		...queryOptions,
	});

	const userRetentionData = {
		labels: Object.keys(data?.sessions ?? {}),
		datasets: [
			{
				label: 'Users uploading files (%)',
				data: Object.values(data?.files ?? {}),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
			},
			{
				label: 'Users logging in (%)',
				data: Object.values(data?.sessions ?? {}),
				borderColor: 'rgb(8, 99, 132)',
				backgroundColor: 'rgba(8, 99, 132, 0.5)',
			},
		],
	} as ChartData<'line'>;

	const userRetentionOptions = {
		responsive: true,
		maintainAspectRatio: false,
		aspectRatio: 2,
		scales: {
			y: {
				ticks: {
					callback: function(value: string | number) {
						return `${(Number(value) * 100).toFixed(0)}%`;
					},
				},
				beginAtZero: true,
				max: 1,
			},
		},
		plugins: {
			tooltip: {
				callbacks: {
					label: (tooltipItem) => {
						const value = Number(tooltipItem.raw || 0);
						return `${(value * 100).toFixed(1)}%`;
					},
				},
			},
		},
	} as ChartOptions<'line'>;

	return isLoading ? (
		<div className="placeholder-glow" style={{ height: '400px', width: '100%' }}>
			<span	className="placeholder col-10 my-1"	style={{ height: '400px', borderRadius: '0.25rem', width: '100%' }}></span>
		</div>
	) : error ? (
		<div className="alert alert-danger" role="alert">
			{error.message}
		</div>
	) : (
		<LineChart
			data={userRetentionData}
			options={userRetentionOptions}
			style={{ height: '400px' }}
		/>
	);
}
