import type { ActiveElement, Chart as ChartJS, ChartData, ChartEvent, ChartOptions, ChartType, ChartTypeRegistry } from 'chart.js';
import type { CSSProperties } from 'react';
import type { StringNumberObj } from '..';

export interface ChartProps<TType extends ChartType = keyof ChartTypeRegistry> {
  data: ChartData<TType>
  options?: ChartOptions<TType> | undefined
  style?: CSSProperties | undefined
}

export interface ObjectOrientedPieChartProps {
  data: StringNumberObj
  onSliceClick?: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => void
}

export type PieChartProps = {}
  & ChartProps<'pie'>
  & {onClick?: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => void}

export interface MimeTypePieChartProps {
  mimeType: StringNumberObj
}