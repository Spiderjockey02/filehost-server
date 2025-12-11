import type { BaseModalProps } from '@/types/Components/Modals';
import InputField from '@/components/Form/InputField';
import { Col, Row } from '@/components/UI/Grid';
import { Modal } from 'react-bootstrap';

export default function SearchFileModal({ show, onClose }: BaseModalProps) {
	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>
          Search for files
				</Modal.Title>
			</Modal.Header>
			<form action="/search" method="GET">
				<Modal.Body>
					<InputField name="query" title='Search for files and folders' autocomplete='off' />
					&nbsp;
					<Row>
						<Col sm={6} className='form-group'>
							<label htmlFor="inputGroupSelect01">File type(s)</label>
							<select className="form-select" id="fileTypeSelector" name="fileType">
								<option value="0">Any type</option>
								<option value="1">Files</option>
								<option value="2">Folders</option>
							</select>
						</Col>
						<Col sm={6} className='form-group'>
							<label htmlFor="inputGroupSelect01">Date updated</label>
							<select className="form-select" id="dateUpdatedSelector" name="dateUpdated">
								<option value="0">Any time</option>
								<option value="1">Past day</option>
								<option value="2">Past week</option>
								<option value="3">Past month</option>
								<option value="4">Past year</option>
							</select>
						</Col>
					</Row>
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
					<button type="submit" className="btn btn-primary">Search</button>
				</Modal.Footer>
			</form>
		</Modal>
	);
}