import type { PasswordResetProps } from '@/types/Components/Email';

export default function PasswordReset({ email, resetPwdURL }: PasswordResetProps) {
	const fontSize = 13;
	const textColour = '#6c757d';

	return (
		<div style={{ backgroundColor: '#eee', width: '100%', padding: '0' }}>
			<table width="100%" style={{ minHeight: '100vh' }}>
				<tbody>
					<tr>
						<td align="center" valign="middle">
							<div style={{ maxWidth: 500, background: '#fff', padding: 30, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
								<img src={`${process.env.BETTER_AUTH_URL}/favicon.ico`} alt="Logo" width={40} height={40} style={{ marginBottom: 16 }} />
								<h3 style={{ marginBottom: 16 }}>Reset your password</h3>
								<p style={{ color: textColour, marginBottom: 24 }}>
                  We received a request to reset the password for your account <strong>{email}</strong>.
								</p>
								<a href={resetPwdURL} style={{ background: '#000', color: '#fff', textDecoration: 'none', padding: '12px 20px', borderRadius: 6, display: 'inline-block', marginBottom: 16	}}>
                  Reset password
								</a>
								<p style={{ textAlign: 'left', fontSize, marginTop: 10 }}>
                  Or copy and paste this URL into your browser:
									<br />
									<span style={{ fontSize, wordBreak: 'break-all' }}>{resetPwdURL}</span>
								</p>
								<hr style={{ borderTop: '1px solid #ddd', margin: '24px 0' }} />
								<p style={{ color: textColour, textAlign: 'left', fontSize }}>
                  This link expires in 60 minutes.
								</p>
								<p style={{ color: textColour, textAlign: 'left', fontSize }}>
                  If you didn&apos;t request a password reset, you can safely ignore this
                  email. Your password will remain unchanged.
								</p>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
