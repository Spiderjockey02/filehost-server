import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import { Card } from '@/components';
import { useState } from 'react';

export default function AdminLogFileCard() {
	const [fileName, setFileName] = useState<string | null>(null);

	const { data, isLoading, error } = useQuery({
		queryKey: ['logFiles', fileName],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/admin/logs/files/${fileName == null ? '' : fileName}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch log files: ${res.statusText}`);

			const d = await res.json();
			return d as { logs: string[] };
		},
		...queryOptions,
	});

	if (error !== null) {
		return (
			<Card>
				<Card.Header>Log files</Card.Header>
				<Card.Body>
					<div className="text-center text-danger fw-bold">
						{error?.message ?? 'Failed to load log files'}
					</div>
				</Card.Body>
			</Card>
		);
	}

	return (
		fileName == null ?
			<Card>
				<Card.Header>Log files</Card.Header>
				<Card.Body style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
					<table className="table">
						<tbody>
							{isLoading ? (
								[0, 0, 0, 0, 0, 0, 0].map((_, index) => (
									<tr key={index}>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
									</tr>
								))
							) : (
								data?.logs.map(name => (
									<tr key={data?.logs.indexOf(name)}>
										<td>
											<button className="btn" onClick={() => setFileName(name)}>{name}</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</Card.Body>
			</Card>
			:
			<Card>
				<Card.Header>
					Log content
				</Card.Header>
				<Card.Body style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
					<button className='btn btn-link' onClick={() => setFileName(null)}>Back</button>
					{isLoading ? (
						[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((_, index) => (
							<div className="placeholder-glow" key={index}>
								<span className="placeholder col-12"></span>
							</div>
						))
					) : (
						data?.logs.map(line => (
							<div key={data?.logs.indexOf(line)}>{line}</div>
						))
					)}
				</Card.Body>
			</Card>
	);
}