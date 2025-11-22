/* eslint-disable @next/next/no-img-element */
import type { VerifyEmailProps } from '@/types/Components/Email';

export default function VerifyEmail({ email, confirmURL }: VerifyEmailProps) {
	return (
		<div style={{ backgroundColor: '#eee', width: '100%' }}>
			<table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ minHeight: '100vh' }}>
				<tbody>
					<tr>
						<td align="center" valign="middle" style={{ padding: '20px 10px' }}>
							<table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ maxWidth: 500, width: '100%' }}>
								<tbody>
									<tr>
										<td>
											<div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
												<img src={`${process.env.BETTER_AUTH_URL}/favicon.ico`} alt="Logo" width={40} height={40} style={{ display: 'block', margin: '0 auto 16px' }} />
												<h3 style={{ marginBottom: 16, fontSize: 20 }}>
                          Verify your email
												</h3>
												<p style={{ color: '#6c757d', marginBottom: 24, fontSize: 15, lineHeight: '22px', textAlign: 'center' }}>
                          Please verify the email address for your account <strong>{email}</strong>.
												</p>
												<a href={confirmURL}	style={{ background: '#000', color: '#fff', textDecoration: 'none', padding: '12px 20px', borderRadius: 6, display: 'inline-block', fontSize: 16, fontWeight: 600, marginBottom: 16, width: '100%', maxWidth: 260, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
                          Verify email
												</a>
												<p style={{ textAlign: 'left' }}>Or copy and paste this URL into your browser: <br />{confirmURL}</p>
												<hr />
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
