import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { ChartProps } from '@/types/Components/Chart';
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data, options = undefined, style = undefined }: ChartProps<'pie'>) {
	return (
		<Pie data={data} options={options} style={style} />
	);
}
