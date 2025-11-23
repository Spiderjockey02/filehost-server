import type { AdminBackupModalProps } from '@/types/Components/Modals';
import { faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatBytes } from '@/utils/functions';
import { Col, Row } from '@/components';
import { Modal } from 'react-bootstrap';

export default function AdminBackupModel({ backup, show, onClose, deleteBackup, downloadBackup }: AdminBackupModalProps) {
	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>
          Database backup: {backup.filename}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Row>
					<Col sm={4}>
						<p className="mb-1"><strong>Created at: </strong></p>
						<p className="mb-1"><strong>Status: </strong></p>
						<p className="mb-1"><strong>Size: </strong></p>
						<p className="mb-1"><strong>Database: </strong></p>
					</Col>
					<Col sm={8}>
						<p className="mb-1">{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(backup.createdAt))}</p>
						<p className="mb-1">
							<span className={`badge ${backup.status === 'success' ? 'bg-success' : 'bg-danger'}`}>
								{backup.status}
							</span>
							{backup.errorMessage && (
								<span className="text-muted ms-2">({backup.errorMessage})</span>
							)}
						</p>
						<p className="mb-1">{formatBytes(backup.sizeBytes)}</p>
						<p className="mb-1">{backup.db}</p>
					</Col>
				</Row>
			</Modal.Body>
			<Modal.Footer>
				<button type="button" className="btn btn-light border" onClick={downloadBackup}>
					<FontAwesomeIcon icon={faDownload} className="me-2" />
          Download
				</button>
				<button type="button" className="btn btn-light border text-danger" onClick={deleteBackup}>
					<FontAwesomeIcon icon={faTrash} className="me-2" />
          Delete
				</button>
				<button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
				</button>
			</Modal.Footer>
		</Modal>
	);
}