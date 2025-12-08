import type { EmailChangedProps } from '@/types/Components/Email';
import Image from 'next/image';
import Link from 'next/link';

export default function EmailAttemptChange({ oldEmail, newEmail, verifyURL }: EmailChangedProps) {
	const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';

	return (
		<div style={{ backgroundColor: '#eee', width: '100%', padding: '0' }}>
			<table width="100%" style={{ minHeight: '100vh' }}>
				<tbody>
					<tr>
						<td align="center" valign="middle">
							<div style={{ maxWidth: 500, background: '#fff', padding: 30, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
								<img src={`${process.env.BETTER_AUTH_URL}/favicon.ico`} alt="Logo" width={40} height={40} style={{ marginBottom: 16 }} />
								<h3 style={{ marginBottom: 16 }}>Email Address Change Attempted</h3>
								<p style={{ textAlign: 'center', fontSize: '13px', marginTop: 10 }}>
                  The email address for your {process.env.NEXT_PUBLIC_COMPANY_NAME} account has been requested to change.
								</p>
								<div style={{ backgroundColor: 'rgb(238, 238, 238)', borderRadius: '0.375rem', textAlign: 'left', padding: '0.5rem', marginBottom: '1.5rem' }}>
									<p style={{ marginBottom: '0.25rem', fontSize: '0.875em' }}>Previous email:</p>
									<p style={{ fontWeight: '500' }}>{oldEmail}</p>
									<p style={{ marginBottom: '0.25rem', fontSize: '0.875em' }}>New email:</p>
									<p style={{ fontWeight: '500' }}>{newEmail}</p>
								</div>
								<p>If you made this change, click the following:</p>
								<button style={{ background: '#1f1f1f', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'inline-block' }}>
									Confirm changes
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
