import { generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { Card, CollapsibleCard } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import API from '@/services/api';

export default function AdminListLogFilesCard() {
	const [fileName, setFileName] = useState<string | null>(null);

	const { data, isLoading, error } = useQuery({
		queryKey: ['logFiles', fileName],
		queryFn: async ({ signal }) => API.ADMIN.fetchLogFiles(signal, fileName),
		...queryOptions,
	});

	if (error !== null) {
		return (
			<Card>
				<Card.Header>Log files</Card.Header>
				<Card.Body>
					<div className="text-center text-danger fw-bold">
						{error.message}
					</div>
				</Card.Body>
			</Card>
		);
	}

	return (
		fileName == null ?
			<CollapsibleCard className='mb-4'>
				<CollapsibleCard.Header id="logFiles">
					Log files
				</CollapsibleCard.Header>
				<CollapsibleCard.Body id="logFiles" style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
					<table className="table">
						<tbody>
							{isLoading ?
								generatePlaceholderTable(7, 1)
							  : data?.logs.map(name => (
									<tr key={data?.logs.indexOf(name)}>
										<td>
											<button className="btn" onClick={() => setFileName(name)}>{name}</button>
										</td>
									</tr>
								))
							}
						</tbody>
					</table>
				</CollapsibleCard.Body>
			</CollapsibleCard>
			:
			<CollapsibleCard className='mb-4'>
				<CollapsibleCard.Header id="logContent">
					Log content: {fileName}
				</CollapsibleCard.Header>
				<CollapsibleCard.Body id="logContent" style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
					<button className='btn btn-link' onClick={() => setFileName(null)}>Back</button>
					{isLoading ?
						generatePlaceholderTable(20, 1)
						: data?.logs.map(line => (
							<div key={data?.logs.indexOf(line)}>{line}</div>
						))
					}
				</CollapsibleCard.Body>
			</CollapsibleCard>
	);
}