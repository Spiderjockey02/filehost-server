import { CountMap } from '@/types';

interface BuildHistoryParams {
  func: (arg0: Date, arg1: Date, params?: any) => Promise<any>
  params?: any
}

export async function buildYearlyHistory({ func, params }: BuildHistoryParams) {
	const data: CountMap = {};
	const currentYear = new Date().getFullYear();
	let cumulativeTotal = await func(new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1), params);

	const yearMappings = Array.from({ length: 10 }, (_, i) => ({ year: currentYear - i, start: new Date(currentYear - i, 0, 1), end: new Date(currentYear - i + 1, 0, 1) })).reverse();
	const yearlyData = await Promise.all(yearMappings.map(({ start, end }) => func(start, end, params)));

	yearMappings.forEach(({ year }, index) => {
		if (typeof yearlyData[index] == 'number') {
			cumulativeTotal += yearlyData[index];
			data[year] = cumulativeTotal;
		} else {
			data[year] = yearlyData[index];
		}
	});

	return data;
}

export async function buildMonthlyHistory({ func, params }: BuildHistoryParams) {
	const data: CountMap = {};
	const current = new Date();
	current.setDate(1);

	const firstMonthDate = new Date();
	firstMonthDate.setMonth(current.getMonth() - 11);
	let cumulativeTotal = await func(new Date(2023, 0, 1), new Date(firstMonthDate), params);

	const ranges: { start: Date; end: Date }[] = [];
	for (let i = 11; i >= 0; i--) {
		const start = new Date(current);
		start.setMonth(current.getMonth() - i);
		const end = new Date(start);
		end.setMonth(start.getMonth() + 1);
		ranges.push({ start, end });
	}

	const monthlyData = await Promise.all(ranges.map(r => func(r.start, r.end, params)));
	monthlyData.forEach((_, index) => {
		const monthName = ranges[index].start.toLocaleString('default', { month: 'long' });
		if (typeof monthlyData[index] == 'number') {
			cumulativeTotal += monthlyData[index];
			data[monthName] = cumulativeTotal;
		} else {
			data[monthName] = monthlyData[index];
		}
	});

	return data;
}

export async function buildDailyHistory({ func, params }: BuildHistoryParams) {
	const data: CountMap = {};
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const frameStart = new Date(today);
	frameStart.setDate(today.getDate() - 14);

	let cumulativeTotal = await func(new Date(2023, 0, 1), frameStart, params);

	const ranges: { start: Date; end: Date }[] = [];
	for (let i = 14; i >= 0; i--) {
		const end = new Date(today);
		end.setDate(today.getDate() - i + 1);

		const start = new Date(end);
		start.setDate(start.getDate() - 1);
		ranges.push({ start, end });
	}

	const dailyData = await Promise.all(ranges.map(r => func(r.start, r.end, params)));
	dailyData.forEach((_, index) => {
		const dateStr = ranges[index].start.toISOString().split('T')[0];
		if (typeof dailyData[index] == 'number') {
			cumulativeTotal += dailyData[index];
			data[dateStr] = cumulativeTotal;
		} else {
			data[dateStr] = dailyData[index];
		}
	});

	return data;
}

export async function buildHourlyHistory({ func, params	 }: BuildHistoryParams) {
	const data: CountMap = {};
	const now = new Date();
	const frameStart = new Date(now);
	frameStart.setHours(now.getHours() - 23, 0, 0, 0);
	let cumulativeTotal = await func(new Date(2023, 0, 1), new Date(frameStart), params);

	const ranges: { start: Date; end: Date }[] = [];
	for (let i = 0; i < 24; i++) {
		const start = new Date(frameStart);
		start.setHours(frameStart.getHours() + i);
		const end = new Date(start);
		end.setHours(start.getHours() + 1);

		ranges.push({ start, end });
	}

	const hourlyData = await Promise.all(ranges.map(r => func(r.start, r.end, params)));
	hourlyData.forEach((_, index) => {
		const hourLabel = `${ranges[index].start.getHours().toString().padStart(2, '0')}:00`;
		if (typeof hourlyData[index] != 'number') {
			cumulativeTotal += hourlyData[index];
			data[hourLabel] = hourlyData[index];
		} else {
			data[hourLabel] = hourlyData[index];
		}
	});

	return data;
}