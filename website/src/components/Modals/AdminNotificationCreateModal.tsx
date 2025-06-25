import { BaseSyntheticEvent, useState } from 'react';
import InputField from '../Form/InputField';
import axios from 'axios';
import SuccessPopup from '../Toasts/SuccessPopup';
import ErrorPopup from '../Toasts/ErrorPopup';

interface Props {
	userId?: string;
}

export default function AdminNotificationCreateModal({ userId }: Props) {
	const [data, setData] = useState({
		text: '', title: '', url: '', userId,
	});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isError, setIsError] = useState(false);

	async function handleNotificationSubmit(event: BaseSyntheticEvent) {
		event.preventDefault();

		try {
			await axios.post('/api/admin/notification', data);
			setIsSuccess(true);
		} catch (err) {
			console.error(err);
			setIsError(true);
		}
	}

	return (
		<div className="modal fade" id="createNotificationModal" role="dialog" aria-hidden="true">
			{isSuccess && <SuccessPopup text="Successfully send notification to user" />}
			{isError && <ErrorPopup text="Failed to create / send notification to user" />}
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title" id="exampleModalLongTitle">Send notification to user</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<form onSubmit={handleNotificationSubmit} method="post">
						<div className="modal-body">
							<InputField title='Title' name="folder" onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))} autocomplete='off' />
							<InputField title='Text' name="folder" onChange={(e) => setData((d) => ({ ...d, text: e.target.value }))} autocomplete='off' />
							<InputField title='URL (Optional)' name="folder" onChange={(e) => setData((d) => ({ ...d, url: e.target.value }))} autocomplete='off' />
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
							<button type="submit" className="btn btn-success">Send</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}