import { faSortUp, faSortDown, faSort } from '@fortawesome/free-solid-svg-icons';
import { generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Table, CollapsibleCard } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import API from '@/services/api';

export default function AdminListUserAgentsCard() {
	const [page, setPage] = useState(0);
	const [filters, setFilters] = useState({
		sortBy: 'name',
		sortOrder: 'desc',
	});

	const { data, isLoading, error } = useQuery({
		queryKey: ['userAgents', filters, page],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({ page: `${page}`, ...filters });
			return API.ADMIN.fetchUserAgents(signal, params);
		},
		...queryOptions,
	});

	return (
		<CollapsibleCard className='mb-4'>
			<CollapsibleCard.Header id="userAgents">
				User agents
			</CollapsibleCard.Header>
			<CollapsibleCard.Body id="userAgents" className='table-responsive'>
				<Table>
					<Table.HeaderRow>
						<Table.Header className='hide-on-mobile'>Agent</Table.Header>
						<Table.Header>Browser</Table.Header>
						<Table.Header>OS</Table.Header>
						<Table.Header>Is Bot</Table.Header>
						<Table.Header style={{ cursor: 'pointer' }} onClick={() => setFilters({ sortBy: 'activity', sortOrder: filters.sortOrder == 'asc' ? 'desc' : 'asc' })}>
							Activity
							&nbsp;
							<FontAwesomeIcon icon={filters.sortBy == 'activity' ? filters.sortOrder == 'asc' ? faSortUp : faSortDown : faSort} />
						</Table.Header>
						<Table.Header style={{ cursor: 'pointer' }} onClick={() => setFilters({ sortBy: 'logs', sortOrder: filters.sortOrder == 'asc' ? 'desc' : 'asc' })}>
							Logs
							&nbsp;
							<FontAwesomeIcon icon={filters.sortBy == 'logs' ? filters.sortOrder == 'asc' ? faSortUp : faSortDown : faSort} />
						</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || data == null ?
								generatePlaceholderTable(20, 6)
								: data.agents.map((agent, index) => (
									<tr key={index}>
										<td className='hide-on-mobile'>{agent.agent}</td>
										<td>{agent.browserName == '' ? 'null' : `${agent.browserName} (${agent.browserVersion})`}</td>
										<td>{agent.osName == '' ? 'null' : `${agent.osName} (${agent.osVersion})`}</td>
										<td>{agent.isBot ? 'Yes' : 'No'}</td>
										<td>{agent._count.activity ?? 0}</td>
										<td>{agent._count.logs ?? 0}</td>
									</tr>
								))
							:
							<tr>
								<td colSpan={6} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to load user agents.'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				<Table.PaginationFooter isLoading={isLoading} total={data?.total} page={page} setPage={setPage} />
			</CollapsibleCard.Body>
		</CollapsibleCard>
	);
}