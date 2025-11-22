import type { EmailChangedProps } from '@/types/Components/Email';
import Image from 'next/image';
import Link from 'next/link';

export default function EmailAttemptChange({ oldEmail, newEmail, verifyURL }: EmailChangedProps) {
	const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';

	return (
		<section className="d-flex flex-row align-items-center" style={{ 'backgroundColor': '#eee', padding: '0', minHeight: '100vh' }}>
			<div className="container">
				<div className="d-flex justify-content-center align-items-center">
					<div className="shadow-sm text-center" style={{ maxWidth: 500, background: '#fff', padding: 30, borderRadius: 8 }}>
						<Image src="/favicon.ico" className="logo mb-3" alt="Logo" width={40} height={40} />
						<h3 className="mb-3">Email Address Change Attempted</h3>
						<p className="text-muted mb-4">The email address for your {process.env.NEXT_PUBLIC_COMPANY_NAME} account has been requested to change.</p>
						<div className="text-start mb-4 p-2" style={{ backgroundColor: 'rgb(238, 238, 238)', borderRadius: '0.375rem' }}>
							<p className="label-title small text-muted mb-1">Previous email:</p>
							<p className="fw-semibold">{oldEmail}</p>
							<p className="label-title small text-muted mb-1 mt-3">New email:</p>
							<p className="fw-semibold">{newEmail}</p>
						</div>
						<p className="text-muted mb-2">If you made this change, click the following:</p>
						<a href={verifyURL} className="btn btn-dark mb-2">Confirm changes</a>
						<hr />
						<p className="text-muted text-start small">
          		If you didn&apos;t authorize this change, please contact support immediately at
							<Link href={`mailto:${supportEmail}`}> {supportEmail}</Link>.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
