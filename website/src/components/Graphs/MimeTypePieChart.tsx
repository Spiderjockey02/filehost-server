import type { MimeTypePieChartProps } from '@/types/Components/Chart';
import ObjectOrientedPieChart from './ObjectOrientedPieChart';
import { ChartEvent, ActiveElement } from 'chart.js';
import type { StringNumberObj } from '@/types';
import { useMemo, useState } from 'react';
import { Card } from '@/components';

export default function MimeTypePieChart({ mimeType }: MimeTypePieChartProps) {
	const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

	// Group the mimetypes by their category
	const groupedData = useMemo(() => {
		const groups: StringNumberObj = {};
		for (const [mime, count] of Object.entries(mimeType)) {
			const [group] = mime.split('/');
			groups[group] = (groups[group] || 0) + count;
		}
		return groups;
	}, [mimeType]);

	// Handle what data should be sent to the pie chart
	const dataToDisplay = useMemo(() => {
		if (!selectedGroup) return groupedData;
		return Object.fromEntries(
			Object.entries(mimeType).filter(([mime]) => mime.startsWith(`${selectedGroup}/`)),
		);
	}, [groupedData, mimeType, selectedGroup]);

	// Handle what section of the pie chart was clicked
	const handleClick = (_event: ChartEvent, elements: ActiveElement[]) => {
		if (!elements.length) return;
		const index = elements[0].index;
		const label = Object.keys(groupedData)[index];
		setSelectedGroup(!selectedGroup && groupedData[label] ? label : null);
	};

	return (
		<Card>
			<Card.Header>
        File MIME Type Distribution
			</Card.Header>
			<Card.Body className='d-flex justify-content-center'>
				<ObjectOrientedPieChart data={dataToDisplay} onSliceClick={handleClick} />
			</Card.Body>
		</Card>
	);
}