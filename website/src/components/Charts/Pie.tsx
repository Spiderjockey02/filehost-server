import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { CSSProperties } from 'react';
ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: ChartData<'pie'>
  options?: ChartOptions<'pie'> | undefined
  style?: CSSProperties | undefined
}
export default function PieChart({ data, options = undefined, style = undefined }: Props) {
	return (
		<Pie data={data} options={options} style={style} />
	);
}
