import type { NewDeviceSigninProps } from '@/types/Components/Email';
import Image from 'next/image';
import Link from 'next/link';

export default function NewDeviceSignin({ email, details }: NewDeviceSigninProps) {
	const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';

	return (
		<section className="d-flex flex-row align-items-center" style={{ 'backgroundColor': '#eee', padding: '0', minHeight: '100vh' }}>
			<div className="container">
				<div className="d-flex justify-content-center align-items-center">
					<div className="shadow-sm text-center" style={{ maxWidth: 500, background: '#fff', padding: 30, borderRadius: 8 }}>
						<Image src="/favicon.ico" className="logo mb-3" alt="Logo" width={40} height={40} />
						<h3 className="mb-3">New sign-in detected</h3>
						<p className="text-muted mb-4">We detected a new sign-in to your {process.env.NEXT_PUBLIC_COMPANY_NAME} account {email} from a device we don&apos;t recognize.</p>
						<div className="text-start mb-4 p-2" style={{ backgroundColor: 'rgb(238, 238, 238)', borderRadius: '0.375rem' }}>
							<p className='small text-muted mb-1'>Device details:</p>
							<p className="fw-bold mb-1">Browser: <span className='fw-normal'>{details.browser}</span></p>
							<p className="fw-bold mb-1">Operating System: <span className='fw-normal'>{details.OS}</span></p>
							<p className="fw-bold mb-1">Location: <span className='fw-normal'>{details.location}</span></p>
							<p className="fw-bold mb-1">IP Address: <span className='fw-normal'>{details.ip}</span></p>
							<p className="fw-bold mb-1">Time: <span className='fw-normal'>{new Intl.DateTimeFormat('en-GB', {
								dateStyle: 'full',
							}).format(new Date(details.time))}</span></p>
						</div>
						<p className="text-muted mb-2">If this was you, you can safely ignore this email. If you don&apos;t recognize this activity, please secure your account immediately.</p>
						<button className="btn btn-dark mb-2">Secure my account</button>
						<hr />
						<p className="text-muted text-start small">
              If you didn&apos;t sign in, please contact support immediately at
							<Link href={`mailto:${supportEmail}`}> {supportEmail}</Link>.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
