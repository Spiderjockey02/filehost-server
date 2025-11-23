import { formatBytes, generatePlaceholderTable, queryOptions } from '@/utils/functions';
import { faCheck, faX, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminBackupModal } from '@/components/Modals';
import { Table, CollapsibleCard } from '@/components';
import { useQuery } from '@tanstack/react-query';
import type { DatabaseBackup } from '@/types';
import { useState } from 'react';

export default function AdminManageDatabaseBackupsCard() {
	const [activeModal, setActiveModal] = useState<string | null>(null);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['databaseBackups'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/admin/database/backups', { signal });
			if (!res.ok) throw new Error(`Failed to fetch backups: ${res.statusText}`);
			return (await res.json()) as { backups: DatabaseBackup[] };
		},
		...queryOptions,
	});

	async function downloadBackup(backupName: string) {
		try {
			const res = await fetch(`/api/admin/database/backup/${backupName}`, {
				method: 'get',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
			});
			const blob = await res.blob();
			// Create blob link to download
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', backupName);

			// Add to page, click and then remove from page
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
		} catch (err) {
			console.log(err);
		}
	}

	async function deleteBackup(backupName: string) {
		try {
			await fetch(`/api/admin/database/backup/${backupName}`, {
				method: 'DELETE',
			});
			refetch();
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<CollapsibleCard className='mb-4'>
			<CollapsibleCard.Header id="databaseBackups">
				Database Backups
			</CollapsibleCard.Header>
			<CollapsibleCard.Body id="databaseBackups" className='table-responsive' style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header>Size</Table.Header>
						<Table.Header className='text-center'>Status</Table.Header>
						<Table.Header className='text-center'>Info</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || data == null ?
								generatePlaceholderTable(7, 4)
							  : data.backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(backup => (
									<tr key={backup.filename}>
										<td>{backup.filename}</td>
										<td>{formatBytes(backup.sizeBytes)}</td>
										<td className='text-center' style={{ color: backup.status == 'success' ? 'green' : 'red' }}>
											<FontAwesomeIcon size='lg' icon={backup.status == 'success' ? faCheck : faX} />
										</td>
										<td className='text-center'>
											<button className='btn' onClick={() => setActiveModal(backup.filename)}>
												<FontAwesomeIcon size='lg' icon={faCircleInfo} />
											</button>
										</td>
									</tr>
								))
							:
							<tr>
								<td colSpan={5} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to load backups'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				{(activeModal && data) && <AdminBackupModal show={true} backup={data.backups.find(b => b.filename == activeModal)!} onClose={() => setActiveModal(null)}
					downloadBackup={() => downloadBackup(data.backups.find(b => b.filename == activeModal)!.filename)} deleteBackup={() => deleteBackup(data.backups.find(b => b.filename == activeModal)!.filename)} />}
			</CollapsibleCard.Body>
		</CollapsibleCard>
	);
}