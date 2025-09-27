import { DatabaseBackup } from '@/types';
import { queryOptions } from '@/utils/functions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useDatabaseBackups() {
	const queryClient = useQueryClient();

	// Fetch backups
	const { data, isLoading, isFetching, error, refetch } = useQuery({
		queryKey: ['databaseBackups'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/admin/database/backups', { signal });
			if (!res.ok) throw new Error(`Failed to fetch backups: ${res.statusText}`);
			return (await res.json()) as { backups: DatabaseBackup[] };
		},
		...queryOptions,
	});

	// Delete backup
	const deleteMutation = useMutation({
		mutationFn: async (backupName: string) => {
			const res = await fetch(`/api/admin/database/backup/${backupName}`, {
				method: 'DELETE',
			});
			if (!res.ok) throw new Error('Failed to delete backup');
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['databaseBackups'] });
		},
	});

	return {
		backups: data?.backups ?? [],
		isLoading,
		isFetching,
		error,
		refetch,
		deleteBackup: deleteMutation.mutateAsync,
		isMutating: deleteMutation.isPending,
	};
}