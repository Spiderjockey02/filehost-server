import type { ObjectOrientedPieChartProps } from '@/types/Components/Chart';
import { getRandomColor } from '@/utils/functions';
import { ChartData, ChartOptions } from 'chart.js';
import PieChart from '../Charts/Pie';

export default function ObjectOrientedPieChart({ data }: ObjectOrientedPieChartProps) {
	const dataset = {
		labels: Object.keys(data),
		datasets: [
			{
				label: 'Accessed',
				data: Object.values(data),
				backgroundColor: Array.from({ length: 10 }, getRandomColor),
				borderWidth: 1,
			},
		],
	} as ChartData<'pie'>;

	const options = {
		plugins: {
			tooltip: {
				callbacks: {
					label: (tooltipItem) => {
						const value = Number(tooltipItem.raw || 0);
						const percentage = (value / Object.values(data).reduce((acc, val) => acc + val, 0)) * 100;
						return `${new Intl.NumberFormat().format(value)} (${percentage < 0.01 ? '<0.01' : percentage.toFixed(2)}%)`;
					},
				},
			},
		},
	} as ChartOptions<'pie'>;

	return (
		<PieChart data={dataset} options={options} style={{ maxHeight: '400px' }} />
	);
}