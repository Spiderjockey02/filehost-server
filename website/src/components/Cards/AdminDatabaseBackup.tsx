import { formatBytes } from '@/utils/functions';
import { faCheck, faX, faCircleInfo, faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminBackupModel } from '../Modals/AdminBackupModal';
import Table from '../UI/Table';
import { useEffect, useState } from 'react';
import { DatabaseBackup } from '@/types';
import Card from '../UI/Card';

export default function AdminDatabaseBackupCard() {
	const [backups, setBackups] = useState<DatabaseBackup[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Fetch recent files
		(async () => {
			try {
				const res = await fetch('/api/admin/database/backups');
				const { backups: resBackups } = await res.json();
				setBackups(resBackups);
				setIsLoading(false);
			} catch (err) {
				console.error(err);
			}
		})();
	}, []);

	async function deleteBackup(backupName: string) {
		try {
			await fetch(`/api/admin/database/backup/${backupName}`, {
				method: 'DELETE',
			});
		} catch (err) {
			console.log(err);
		}
	}

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
			const url = window.URL.createObjectURL(new Blob([blob]));
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

	async function createDatabaseBackup() {
		try {
			await fetch('/api/admin/database/backup', {
				method: 'POST',
			});
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<Card>
			<Card.Header>
				Database Backups
				<button className='btn btn-secondary' onClick={createDatabaseBackup}>Backup</button>
			</Card.Header>
			<Card.Body>
				<Table>
					<Table.HeaderRow>
						<Table.Header>Name</Table.Header>
						<Table.Header>Size</Table.Header>
						<Table.Header className='text-center'>Status</Table.Header>
						<Table.Header className='text-center'>Info</Table.Header>
						<Table.Header className='text-center hide-on-mobile'>Actions</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{isLoading ? (
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
									<td className="placeholder-glow">
										<span className="placeholder col-12"></span>
									</td>
								</tr>
							))
						) : (
							backups.map(backup => (
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
									<td className='hide-on-mobile'>
										<div className='d-flex flex-row align-items-center justify-content-around'>
											<button className='btn' onClick={() => downloadBackup(backup.filename)}>
												<FontAwesomeIcon size='lg' icon={faDownload} />
											</button>
											<button className='btn' onClick={() => deleteBackup(backup.filename)}>
												<FontAwesomeIcon size='lg' icon={faTrash} />
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</Table.Body>
				</Table>
				{backups.map(backup => (<AdminBackupModel backup={backup} key={backup.filename} downloadBackup={() => downloadBackup(backup.filename)} deleteBackup={() => deleteBackup(backup.filename)} />))}
			</Card.Body>
		</Card>
	);
}