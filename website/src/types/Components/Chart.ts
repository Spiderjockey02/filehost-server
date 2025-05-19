import { ChartData, ChartOptions, ChartType, ChartTypeRegistry } from 'chart.js';
import { CSSProperties } from 'react';
import { StringNumberObj } from '..';

export interface ChartProps<TType extends ChartType = keyof ChartTypeRegistry> {
  data: ChartData<TType>
  options?: ChartOptions<TType> | undefined
  style?: CSSProperties | undefined
}

export interface ObjectOrientedPieChartProps {
  data: StringNumberObj
}