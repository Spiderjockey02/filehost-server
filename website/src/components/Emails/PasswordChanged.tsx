import type { PasswordChangedProps } from '@/types/Components/Email';

export default function PasswordChanged({ email }: PasswordChangedProps) {
	const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';

	return (
		<div style={{ backgroundColor: '#eee', width: '100%', padding: '0' }}>
			<table width="100%" style={{ minHeight: '100vh' }}>
				<tbody>
					<tr>
						<td align="center" valign="middle">
							<div style={{ maxWidth: 500, background: '#fff', padding: 30, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
								<img src={`${process.env.BETTER_AUTH_URL}/favicon.ico`} alt="Logo" width={40} height={40} style={{ marginBottom: 16 }} />
								<h3 style={{ marginBottom: 16 }}>Password changed successfully</h3>
								<p style={{ textAlign: 'center', fontSize: '13px', marginTop: 10 }}>
                  The password for your {process.env.NEXT_PUBLIC_COMPANY_NAME} account {email} has been changed successfully.
								</p>
								<div style={{ backgroundColor: 'rgb(238, 238, 238)', borderRadius: '0.375rem', textAlign: 'left', padding: '0.5rem', marginBottom: '1.5rem' }}>
									<p style={{ margin: 0, fontSize: '0.875em' }}>Changed at:</p>
									<p style={{ fontWeight: '700', margin: 0 }}>{new Intl.DateTimeFormat('en-GB', {
										dateStyle: 'full',
									}).format(new Date())}</p>
								</div>
								<p>If you made this change, you can safely ignore this email. Your account is secure.</p>
								<button style={{ background: '#1f1f1f', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'inline-block' }}>
									I didn&apos;t make this change
								</button>
								<hr style={{ borderTop: '1px solid #ddd', margin: '24px 0' }} />
								<p style={{ textAlign: 'left', fontSize: '0.875em' }}>
             			If you didn&apos;t authorize this change, please contact support immediately at
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
