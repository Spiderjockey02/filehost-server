import { convertMiliseconds, generatePlaceholderTable, queryOptions } from '@/utils/functions';
import type { cacheStat, cacheStats } from '@/types/Components/Card';
import { useQuery } from '@tanstack/react-query';
import { Card, Table } from '@/components';

export default function AdminManageCacheCard() {
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
						<Table.Header className='text-center'>Size</Table.Header>
						<Table.Header className='text-center'>Max</Table.Header>
						<Table.Header className='text-center'>TTL</Table.Header>
						<Table.Header className='text-center'>Actions</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || stats == null ?
								generatePlaceholderTable(4, 8)
								: <>
									{buildCacheRow('Files', stats.files, () => deleteCache('files'))}
									{buildCacheRow('MIME types', stats.mimeTypes, () => deleteCache('mimetype'))}
									{buildCacheRow('Users', stats.users, () => deleteCache('users'))}
									{buildCacheRow('User history', stats.userHistory, () => deleteCache('history'))}
									{buildCacheRow('Sessions', stats.sessions, () => deleteCache('sessions'))}
									{buildCacheRow('IPs', stats.ips, () => deleteCache('ips'))}
									{buildCacheRow('User agents', stats.userAgents, () => deleteCache('userAgents'))}
								</>
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

function buildCacheRow(type: string, stats: cacheStat, onClick: () => void) {
	return (
		<tr>
			<td>{type}</td>
			<td className='text-center'>{stats.size}</td>
			<td className='text-center'>{stats.max}</td>
			<td className='text-center'>{convertMiliseconds(stats.ttl / 1000)}</td>
			<td className='text-center'><button className='btn btn-danger btn-sm' onClick={onClick}>Clear</button></td>
		</tr>
	);
}