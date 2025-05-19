import Table from '../UI/Table';
import { convertMiliseconds, formatBytes } from '@/utils/functions';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useFetchWithCleanup } from '../Hooks/useFetchWithCleanup';
import type { cacheStats, thumbnailStats } from '@/types/Components/Card';
import Card from '../UI/Card';

export default function AdminCacheCard(thumbnailCache: thumbnailStats) {
	const { data: stats, loading: isLoading } = useFetchWithCleanup<cacheStats>('/api/admin/cache/stats');

	async function deleteCache(name: string) {
		try {
			await fetch(`/api/admin/cache/${name}`, {
				method: 'DELETE',
			});
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<Card>
			<Card.Header>
				Cache
			</Card.Header>
			<Card.Body>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header>Size</Table.Header>
						<Table.Header>Max</Table.Header>
						<Table.Header>TTL</Table.Header>
						<Table.Header>Actions</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{isLoading || stats == null ? (
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
							</>
						)}
						<tr>
							<td>Thumbnails</td>
							<td>{thumbnailCache.count} ({formatBytes(thumbnailCache.sizeInBytes)})</td>
							<td><FontAwesomeIcon icon={faInfinity} /></td>
							<td><FontAwesomeIcon icon={faInfinity} /></td>
							<td><button className='btn btn-danger btn-sm' onClick={() => deleteCache('thumbnails')}>Reset</button></td>
						</tr>
					</Table.Body>
				</Table>
			</Card.Body>
		</Card>
	);
}