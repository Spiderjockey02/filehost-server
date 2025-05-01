import { useUploadQueue } from '../Hooks/UploadContentManager';

export default function UploadStatusToast() {
	const { status, cancelUpload } = useUploadQueue();
	if (!status || status.error === 'File with that name already exists') return null;

	return (
		<div className="toast-container position-fixed bottom-0 end-0 p-3">
			<div className="toast show mb-2">
				<div className="toast-header">
					{status.progress < 100 ?
						<>
							<strong className="me-auto">Uploading ({status.progress}%)</strong>
							<small>{status.remaining}</small>
							<button type="button" className="btn-close" onClick={() => cancelUpload()}></button>
						</>
					 : <>
							<strong className="me-auto">Upload Complete</strong>
							<button type="button" className="btn-close" onClick={() => cancelUpload()}></button>
					 </>
					}
				</div>
				<div className="toast-body">
					{status.filename}
					{status.error && <div className="text-danger mt-1">{status.error}</div>}
				</div>
			</div>
		</div>
	);
}