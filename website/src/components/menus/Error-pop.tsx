import Link from 'next/link';
interface Props {
  text: string
}

export default function ErrorPopup({ text }: Props) {
	return (
		<div className="alert alert-danger alert-dismissible fade show" role="alert">
			<strong>Error - {text}!</strong> If this error keeps occurring, please contact <Link href="/contact-us">support</Link>.
			<button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
		</div>
	);
}
