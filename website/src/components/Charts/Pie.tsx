import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { PieChartProps } from '@/types/Components/Chart';
import { Pie } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data, options = undefined, style = undefined, onClick }: PieChartProps) {
	return (
		<Pie data={data} options={{ ...options, onClick }} style={style} />
	);
}
