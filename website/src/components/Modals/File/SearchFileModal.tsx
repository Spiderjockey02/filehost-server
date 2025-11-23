import type { BaseModalProps } from '@/types/Components/Modals';
import { Modal } from 'react-bootstrap';

export default function SearchFileModal({ show, onClose }: BaseModalProps) {
	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>
          Search for file
				</Modal.Title>
			</Modal.Header>
			<form action="/search" method="GET">
				<Modal.Body>
					<input type="text" id="myInput" className="form-input form-control text-truncate" style={{ border:'none', backgroundColor:'#f4f4f4' }} placeholder="Search files and folders" name="query" autoComplete="off" />
					&nbsp;
					<div className="row">
						<div className="form-group col-6">
							<label htmlFor="inputGroupSelect01">File type(s)</label>
							<select className="form-select" id="fileTypeSelector" name="fileType">
								<option value="0">Any type</option>
								<option value="1">Files</option>
								<option value="2">Folders</option>
							</select>
						</div>
						<div className="form-group col-6">
							<label htmlFor="inputGroupSelect01">Date updated</label>
							<select className="form-select" id="dateUpdatedSelector" name="dateUpdated">
								<option value="0">Any time</option>
								<option value="1">Past day</option>
								<option value="2">Past week</option>
								<option value="3">Past month</option>
								<option value="4">Past year</option>
							</select>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
					<button type="submit" className="btn btn-primary">Search</button>
				</Modal.Footer>
			</form>
		</Modal>
	);
}