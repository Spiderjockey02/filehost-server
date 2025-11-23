import { Chart as ChartJS, ArcElement, Tooltip, Legend,	CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import type { ChartProps } from '@/types/Components/Chart';
import { Line } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function LineChart({ data, options = undefined, style = undefined }: ChartProps<'line'>) {
	return (
		<Line data={data} options={options} style={style}/>
	);
}
