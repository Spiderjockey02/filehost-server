import { generatePlaceholderTable, parseUserAgent, queryOptions } from '@/utils/functions';
import type { AdminListSessionsCardProps } from '@/types/Components/Card';
import type { Session } from '@/types/generated/browser';
import { useQuery } from '@tanstack/react-query';
import Table from '../UI/Table';

export default function SessionTable({ userId, isAdmin }: AdminListSessionsCardProps) {
	const { data, isLoading, error } = useQuery({
		queryKey: ['sessions', { userId, isAdmin }],
		queryFn: async ({ signal }) => {
			const url = isAdmin ? `/api/admin/users/sessions?userId=${userId}` : '/api/session/list';
			const res = await fetch(url, { signal });
			if (!res.ok) throw new Error(`Failed to fetch user's sessions: ${res.statusText}`);

			const d = await res.json();
			return d as { sessions: Session[] };
		},
		...queryOptions,
	});

	return (
		<Table>
			<Table.HeaderRow>
				<Table.Header>IP</Table.Header>
				<Table.Header>User Agent</Table.Header>
				<Table.Header>Created at</Table.Header>
				<Table.Header>Expires at</Table.Header>
			</Table.HeaderRow>
			<Table.Body>
				{error == null ?
					isLoading || data == null ?
						generatePlaceholderTable(4, 4)
						: data?.sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(userSes => (
							<tr key={userSes.id}>
								<td>{userSes.ipAddress}</td>
								<td>{parseUserAgent(userSes.userAgent)}</td>
								<td>{new Date(userSes.createdAt).toLocaleDateString()}</td>
								<td>{new Date(userSes.expiresAt).toLocaleDateString()}</td>
							</tr>
						))
					:
					<tr>
						<td colSpan={userId == undefined ? 7 : 6} className="text-center text-danger fw-bold">
							{error?.message ?? 'Failed to fetch recent activity.'}
						</td>
					</tr>
				}
			</Table.Body>
		</Table>
	);
}