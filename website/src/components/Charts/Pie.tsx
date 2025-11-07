import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartEvent, ActiveElement } from 'chart.js';
import type { ChartProps } from '@/types/Components/Chart';
import { Pie } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data, options = undefined, style = undefined, onClick }: ChartProps<'pie'> & {onClick?: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => void}) {
	return (
		<Pie data={data} options={{ ...options, onClick }} style={style} />
	);
}
