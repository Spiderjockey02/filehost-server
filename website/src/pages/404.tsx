import Link from 'next/link';

export default function FourOhFour() {
	return (
		<div className="page-wrap d-flex flex-row align-items-center" style={{ backgroundColor:'#f1f6fe', height: '100vh' }}>
			<div className="container">
				<div className="row justify-content-center align-middle">
					<div className="col-md-12 text-center">
						<span className="display-1 d-block">404</span>
						<div className="mb-4 lead">The page you are looking for was not found.</div>
						<Link href="/" className="btn btn-link">Back to Home</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
