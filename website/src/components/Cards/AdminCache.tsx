import { convertMiliseconds, formatBytes, queryOptions } from '@/utils/functions';
import type { cacheStats, thumbnailStats } from '@/types/Components/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';

export default function AdminCacheCard(thumbnailCache: thumbnailStats) {
	const { data: stats, isLoading, refetch, error } = useQuery({
		queryKey: ['cacheStats'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/admin/cache/stats', { signal });
			if (!res.ok) throw new Error(`Failed to fetch cache stats: ${res.statusText}`);

			const d = await res.json();
			return d as cacheStats;
		},
		...queryOptions,
	});

	async function deleteCache(name: string) {
		try {
			await fetch(`/api/admin/cache/${name}`, {
				method: 'DELETE',
			});
			await refetch();
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<Card>
			<Card.Header>
				Cache
			</Card.Header>
			<Card.Body className='table-responsive'>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header>Size</Table.Header>
						<Table.Header>Max</Table.Header>
						<Table.Header>TTL</Table.Header>
						<Table.Header>Actions</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || stats == null ? (
								[0, 0, 0, 0].map((_, index) => (
									<tr key={index}>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
									</tr>
								))
							) : (
								<>
									<tr>
										<td>Files</td>
										<td>{stats.files.size}</td>
										<td>{stats.files.max}</td>
										<td>{convertMiliseconds(stats.files.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('files')}>Reset</button></td>
									</tr>
									<tr>
										<td>MIME types</td>
										<td>{stats.mimeTypes.size}</td>
										<td>{stats.mimeTypes.max}</td>
										<td>{convertMiliseconds(stats.mimeTypes.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('mimetype')}>Reset</button></td>
									</tr>
									<tr>
										<td>Users</td>
										<td>{stats.users.size}</td>
										<td>{stats.users.max}</td>
										<td>{convertMiliseconds(stats.users.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('users')}>Reset</button></td>
									</tr>
									<tr>
										<td>User History</td>
										<td>{stats.userHistory.size}</td>
										<td>{stats.userHistory.max}</td>
										<td>{convertMiliseconds(stats.userHistory.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('history')}>Reset</button></td>
									</tr>
									<tr>
										<td>Sessions</td>
										<td>{stats.sessions.size}</td>
										<td>{stats.sessions.max}</td>
										<td>{convertMiliseconds(stats.sessions.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('sessions')}>Reset</button></td>
									</tr>
									<tr>
										<td>IPs</td>
										<td>{stats.ips.size}</td>
										<td>{stats.ips.max}</td>
										<td>{convertMiliseconds(stats.ips.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('ips')}>Reset</button></td>
									</tr>
									<tr>
										<td>User agents</td>
										<td>{stats.userAgents.size}</td>
										<td>{stats.userAgents.max}</td>
										<td>{convertMiliseconds(stats.userAgents.ttl / 1000)}</td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('userAgents')}>Reset</button></td>
									</tr>
									<tr>
										<td>Thumbnails</td>
										<td>{thumbnailCache.count} ({formatBytes(thumbnailCache.sizeInBytes)})</td>
										<td><FontAwesomeIcon icon={faInfinity} /></td>
										<td><FontAwesomeIcon icon={faInfinity} /></td>
										<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('thumbnails')}>Reset</button></td>
									</tr>
								</>
							)
							:
							<tr>
								<td colSpan={5} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to load cache stats'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
			</Card.Body>
		</Card>
	);
}