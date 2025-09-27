import { faCheck, faX, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { useDatabaseBackups } from '../Hooks/useDatabaseBackups';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminBackupModel } from '../Modals/AdminBackupModal';
import { formatBytes } from '@/utils/functions';
import { Table, Card } from '@/components';

export default function AdminDatabaseBackupCard() {
	const { backups, error, isLoading, isMutating, deleteBackup } = useDatabaseBackups();

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

	return (
		<Card className='mb-4'>
			<Card.Header>
				Database Backups
			</Card.Header>
			<Card.Body className='table-responsive' style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header>Size</Table.Header>
						<Table.Header className='text-center'>Status</Table.Header>
						<Table.Header className='text-center'>Info</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{error == null ?
							isLoading || isMutating ? (
								[0, 0, 0, 0, 0, 0, 0].map((_, index) => (
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
									</tr>
								))
							) : (
								backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(backup => (
									<tr key={backup.filename}>
										<td>{backup.filename}</td>
										<td>{formatBytes(backup.sizeBytes)}</td>
										<td className='text-center' style={{ color: backup.status == 'success' ? 'green' : 'red' }}>
											<FontAwesomeIcon size='lg' icon={backup.status == 'success' ? faCheck : faX} />
										</td>
										<td className='text-center'>
											<button className='btn' data-bs-toggle="modal" data-bs-target={`#${new Date(backup.createdAt).getTime()}`}>
												<FontAwesomeIcon size='lg' icon={faCircleInfo} />
											</button>
										</td>
									</tr>
								))
							) :
							<tr>
								<td colSpan={5} className="text-center text-danger fw-bold">
									{error?.message ?? 'Failed to load backups'}
								</td>
							</tr>
						}
					</Table.Body>
				</Table>
				{backups.map(backup => (<AdminBackupModel backup={backup} key={backup.filename} downloadBackup={() => downloadBackup(backup.filename)} deleteBackup={() => deleteBackup(backup.filename)} />))}
			</Card.Body>
		</Card>
	);
}