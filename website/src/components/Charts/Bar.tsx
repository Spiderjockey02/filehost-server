import { Chart as ChartJS, Tooltip, Legend,	CategoryScale, LinearScale, Title, BarElement } from 'chart.js';
import type { ChartProps } from '@/types/Components/Chart';
import { Bar } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BarChart({ data, options = undefined, style = undefined }: ChartProps<'bar'>) {
	return (
		<Bar data={data} options={options} style={style}/>
	);
}
