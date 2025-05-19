import type { AdminBackupModalProps } from '@/types/Components/Modals';
import { formatBytes } from '@/utils/functions';
import { faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function AdminBackupModel({ backup, deleteBackup, downloadBackup }: AdminBackupModalProps) {
	return (
		<div className="modal fade" id={`${new Date(backup.createdAt).getTime()}`} role="dialog" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title" id="exampleModalLongTitle">Database backup: {backup.filename}</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body">
						<ul className="list-unstyled">
							<li>
								<strong>Created at: </strong>{new Intl.DateTimeFormat('en-GB', {
									dateStyle: 'full',
									timeStyle: 'long',
								}).format(new Date(backup.createdAt))}</li>
							<li>
								<strong>Status: </strong>
								<span className={backup.status == 'success' ? 'text-success' : 'text-danger'}>
									{backup.status} {backup.errorMessage !== null ? `(${backup.errorMessage})` : ''}
								</span>
							</li>
							<li>
								<strong>Size: </strong>{formatBytes(backup.sizeBytes)}
							</li>
							<li>
								<strong>Database name: </strong>{backup.db}
							</li>
						</ul>
						<button className='btn btn-secondary' onClick={downloadBackup}>
							Download <FontAwesomeIcon size='lg' icon={faDownload} />
						</button>
						&nbsp;
						<button className='btn btn-secondary' onClick={deleteBackup}>
							Delete <FontAwesomeIcon size='lg' icon={faTrash} />
						</button>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>
	);
}