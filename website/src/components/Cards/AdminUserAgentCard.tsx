import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import Card from '../UI/Card';
import Table from '../UI/Table';
import { UserAgentWithCounts } from '@/types/database';

export default function AdminUserAgentCard() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['recentActivity'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/admin/network/user-agents', { signal });
			if (!res.ok) throw new Error(`Failed to fetch user agents: ${res.statusText}`);

			const d = await res.json();
			return d as { agents: UserAgentWithCounts[] };
		},
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>
        User agents
			</Card.Header>
			<Card.Body>
				<div className='table-responsive'>
					<Table>
						<Table.HeaderRow>
							<Table.Header>Agent</Table.Header>
							<Table.Header>Browser</Table.Header>
							<Table.Header>OS</Table.Header>
							<Table.Header>Is Bot</Table.Header>
							<Table.Header>Activity</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{error == null ?
								isLoading || data == null ?
									(
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((_, index) => (
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
										data.agents.map((agent, index) => (
											<tr key={index}>
												<td>{agent.agent}</td>
												<td>{agent.browserName == '' ? 'null' : `${agent.browserName} (${agent.browserVersion})`}</td>
												<td>{agent.osName == '' ? 'null' : `${agent.osName} (${agent.osVersion})`}</td>
												<td>{agent.isBot ? 'Yes' : 'No'}</td>
												<td>{agent._count?.activity ?? 0}</td>
											</tr>
										))
									)
								 :
								<tr>
									<td colSpan={5} className="text-center text-danger fw-bold">
										{error?.message ?? 'Failed to load user agents.'}
									</td>
								</tr>
							}
						</Table.Body>
					</Table>
				</div>
			</Card.Body>
		</Card>
	);
}