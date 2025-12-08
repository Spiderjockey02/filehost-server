import type { NewDeviceSigninProps } from '@/types/Components/Email';

export default function NewDeviceSignin({ email, details }: NewDeviceSigninProps) {
	const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';

	return (
		<div style={{ backgroundColor: '#eee', width: '100%', padding: '0' }}>
			<table width="100%" style={{ minHeight: '100vh' }}>
				<tbody>
					<tr>
						<td align="center" valign="middle">
							<div style={{ maxWidth: 500, background: '#fff', padding: 30, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
								<img src={`${process.env.BETTER_AUTH_URL}/favicon.ico`} alt="Logo" width={40} height={40} style={{ marginBottom: 16 }} />
								<h3 style={{ marginBottom: 16 }}>New sign-in detected</h3>
								<p style={{ textAlign: 'center', fontSize: '13px', marginTop: 10 }}>
                  We detected a new sign-in to your {process.env.NEXT_PUBLIC_COMPANY_NAME} account {email} from a device we don&apos;t recognize.
								</p>
								<div style={{ backgroundColor: 'rgb(238, 238, 238)', borderRadius: '0.375rem', textAlign: 'left', padding: '0.5rem', marginBottom: '1.5rem' }}>
									<p style={{ marginBottom: '0.25rem', fontSize: '0.875em' }}>Device details:</p>
									<p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Browser: <span style={{ fontWeight: '400' }}>{details.browser}</span></p>
									<p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Operating System: <span style={{ fontWeight: '400' }}>{details.OS}</span></p>
									<p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Location: <span style={{ fontWeight: '400' }}>{details.location}</span></p>
									<p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>IP Address: <span style={{ fontWeight: '400' }}>{details.ip}</span></p>
									<p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Time: <span style={{ fontWeight: '400' }}>{new Intl.DateTimeFormat('en-GB', {
										dateStyle: 'full',
									}).format(new Date(details.time))}</span></p>
								</div>
								<p>If this was you, you can safely ignore this email. If you don&apos;t recognize this activity, please secure your account immediately.</p>
								<button style={{ background: '#1f1f1f', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'inline-block' }}>
									Secure my account
								</button>
								<hr style={{ borderTop: '1px solid #ddd', margin: '24px 0' }} />
								<p style={{ textAlign: 'left', fontSize: '0.875em' }}>
             			If you didn&apos;t sign in, please contact support immediately at
									<a href={`mailto:${supportEmail}`}> {supportEmail}</a>.
								</p>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
