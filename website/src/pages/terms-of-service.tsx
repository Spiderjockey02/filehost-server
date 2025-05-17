import { authClient } from '@/auth/client';
import MainLayout from '@/layouts/main';
import config from '@/config';

export default function TermsOfService() {
	const { data } = authClient.useSession();

	return (
		<MainLayout user={data?.user ?? null} tabName='Terms of Service'>
			<div className="container my-5">
				<h1 className="text-center mb-4">Terms of Service</h1>
				<p className="text-muted text-center">Effective Date: <strong>22 January 2025</strong></p>
				<section>
					<h2>1. Acceptance of Terms</h2>
					<p>
            By using our services, you confirm that you are at least 18 years old (or the age of majority in your jurisdiction)
            and that you have the legal capacity to enter into this agreement. If you are using the services on behalf of an
            organization, you agree to these Terms on behalf of that organization.
					</p>
				</section>

				<section>
					<h2>2. Account Registration and Security</h2>
					<ul>
						<li>You must create an account to access our services and provide accurate, complete, and up-to-date information.</li>
						<li>You are responsible for maintaining the security of your account, including safeguarding your password.</li>
						<li>We are not responsible for unauthorized access to your account resulting from your failure to secure your login credentials.</li>
					</ul>
				</section>

				<section>
					<h2>3. Use of Services</h2>
					<p>You agree to use the services only for lawful purposes and in compliance with all applicable laws and regulations.</p>
					<ul>
						<li>Do not upload or store illegal, infringing, or harmful content.</li>
						<li>Do not distribute malware, spam, or malicious code.</li>
						<li>Do not attempt to gain unauthorized access to the system.</li>
					</ul>
				</section>

				<section>
					<h2>4. Storage and Data Retention</h2>
					<ul>
						<li>Storage limits may apply based on your subscription plan.</li>
						<li>We implement industry-standard security measures but do not guarantee complete security.</li>
						<li>We may delete your data after account termination or prolonged inactivity.</li>
					</ul>
				</section>

				<section>
					<h2>5. Payment and Subscription Plans</h2>
					<ul>
						<li>Some features require payment, and you agree to our pricing and billing terms.</li>
						<li>Subscription fees are non-refundable unless otherwise stated.</li>
						<li>We reserve the right to change pricing with notice.</li>
					</ul>
				</section>

				<section>
					<h2>6. Termination</h2>
					<p>We may suspend or terminate your account for:</p>
					<ul>
						<li>Violation of these Terms.</li>
						<li>Non-payment of fees.</li>
						<li>Harmful activities toward the service or its users.</li>
					</ul>
				</section>

				<section>
					<h2>7. Intellectual Property Rights</h2>
					<ul>
						<li>You retain ownership of content uploaded to the service.</li>
						<li>We may store, process, and transmit content as necessary to provide the service.</li>
						<li>Our trademarks and branding cannot be used without permission.</li>
					</ul>
				</section>

				<section>
					<h2>8. Privacy</h2>
					<p>Your use of the service is subject to our <a href="#">Privacy Policy</a>, which explains how we handle your data.</p>
				</section>

				<section>
					<h2>9. Limitation of Liability</h2>
					<p>We are not liable for indirect, incidental, special, or consequential damages, including loss of data or profits.</p>
				</section>

				<section>
					<h2>10. Dispute Resolution</h2>
					<p>Any disputes will be resolved through binding arbitration in [Your Jurisdiction]. Class action participation is waived.</p>
				</section>

				<section>
					<h2>11. Changes to Terms</h2>
					<p>We reserve the right to modify these Terms, with continued use constituting acceptance of the revised Terms.</p>
				</section>

				<section>
					<h2>12. Contact Information</h2>
					<p>If you have any questions, please contact us at:</p>
					<address>
						<strong>{config.company.name}</strong><br />
            Email: <a href="mailto:[Your Contact Email]">{config.company.email}</a><br />
            Address: [Your Address]
					</address>
				</section>
				<p className="text-center mt-5">By using our services, you acknowledge that you have read, understood, and agree to these Terms.</p>
			</div>
		</MainLayout>
	);
}