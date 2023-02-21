interface Props {
  text: string
}

export default function SuccessPopup({ text }: Props) {
	return (
		<div className="alert alert-success alert-dismissible fade show" role="alert" style={{ zIndex:100 }}>
			<strong>Success - {text}!</strong>
			<button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
		</div>
	);
}
