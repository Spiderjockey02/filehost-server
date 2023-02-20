interface Props {
  percentage: number
  filename: string
  show: boolean
}

export default function Toast({ percentage, filename, show }: Props) {

	return (
		<>
			{show && (
				<div className="toast-container position-fixed bottom-0 end-0 p-3">
					<div id="liveToast" className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
						<div className="toast-header">
							<strong className="me-auto">Uploading ({percentage}%)</strong>
							<small>11 mins ago</small>
							<button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
						</div>
						<div className="toast-body">
							{filename}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
