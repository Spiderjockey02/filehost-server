import type { FileUploadActionModalProps } from '@/types/Components/Modals';
import { Modal } from 'react-bootstrap';

export default function FileUploadActionModal({ fileName, show, onAction }: FileUploadActionModalProps) {
	return (
		<Modal show={show} centered backdrop="static" keyboard={false}>
			<Modal.Header closeButton>
				<Modal.Title>Action failed for: {fileName}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				A file with that name already exists. Add it as a new version of the existing file, or keep both copies.
			</Modal.Body>
			<Modal.Footer>
				<button type="button" className="btn btn-secondary" onClick={() => onAction('replace')}>
					Replace
				</button>
				<button type="button" className="btn btn-primary" onClick={() => onAction('keep')}>
					Keep both
				</button>
				<button type="button" className="btn btn-outline-danger" onClick={() => onAction('cancel')}>
					Cancel upload
				</button>
			</Modal.Footer>
		</Modal>
	);
}
