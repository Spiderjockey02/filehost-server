import { Chart as ChartJS, Tooltip, Legend,	CategoryScale, LinearScale, Title, BarElement } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import type { CSSProperties } from 'react';
import { Bar } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'> | undefined
  style?: CSSProperties | undefined
}

export default function BarChart({ data, options = undefined, style = undefined }: Props) {
	return (
		<Bar data={data} options={options} style={style}/>
	);
}
