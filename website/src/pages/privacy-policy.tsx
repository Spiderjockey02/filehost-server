import type { GetServerSidePropsContext } from 'next';
import type { PageProps } from '@/types/pages';
import MainLayout from '@/layouts/main';
import API from '@/services/api';

export default function PrivacyPolicyPage({ user }: PageProps) {
	return (
		<MainLayout user={user} tabName='Privacy Policy'>
			<div className="container py-5">
				<header className="mb-5">
					<h1 className="display-5 fw-bold">Privacy Policy</h1>
					<p className="text-muted">Last updated: [DATE]</p>
				</header>

				<section className="mb-5">
					<h2 className="h4">Quick Summary</h2>
					<ul>
						<li>We collect account details (name, email, password), files and metadata, billing data, and usage logs.</li>
						<li>We use your data to provide cloud storage, generate previews, process payments, and keep the service secure.</li>
						<li>Files are stored with third-party providers (e.g., AWS S3). Payments are handled by Stripe; we never store card details.</li>
						<li>You have rights to access, correct, delete, or export your data. Contact us at <strong>[CONTACT EMAIL]</strong>.</li>
					</ul>
				</section>

				<section>
					<h2 className="h4">1. Introduction</h2>
					<p>This Privacy Policy describes how <strong>[COMPANY / CONTROLLER NAME]</strong> (“we”, “our”, or “us”) collects, uses, discloses, and protects personal data when you use <strong>[SERVICE NAME]</strong>.</p>

					<h2 className="h4 mt-4">2. Data We Collect</h2>
					<ul>
						<li><strong>Account data:</strong> name, email, password (hashed), optional avatar.</li>
						<li><strong>Files & metadata:</strong> file contents, names, sizes, thumbnails, timestamps.</li>
						<li><strong>Billing data:</strong> via Stripe (we do not store raw card numbers).</li>
						<li><strong>Usage data:</strong> IP address, device/browser info, logs of actions.</li>
						<li><strong>Support data:</strong> communications you send us.</li>
					</ul>

					<h2 className="h4 mt-4">3. How We Use Data</h2>
					<ul>
						<li>Provide the Service (file storage, sharing, previews).</li>
						<li>Process payments and manage subscriptions.</li>
						<li>Authenticate users and secure accounts.</li>
						<li>Improve features and monitor usage.</li>
						<li>Comply with legal obligations.</li>
					</ul>

					<h2 className="h4 mt-4">4. Sharing & Third Parties</h2>
					<p>We may share data with trusted providers such as:</p>
					<ul>
						<li>Cloud storage (e.g., Amazon S3)</li>
						<li>Payment processing (e.g., Stripe)</li>
						<li>Hosting & infrastructure (e.g., AWS, Vercel)</li>
						<li>Analytics & monitoring (e.g., Sentry, Google Analytics)</li>
					</ul>

					<h2 className="h4 mt-4">5. Retention</h2>
					<p>We keep your data as long as your account is active. After deletion requests, we remove files and personal data within [X]–[Y] days, except where law requires longer retention (e.g., billing records).</p>

					<h2 className="h4 mt-4">6. Security</h2>
					<p>We use TLS encryption, hashed passwords, access controls, and secure hosting. No system is 100% secure; if a breach occurs, we will notify you as required by law.</p>

					<h2 className="h4 mt-4">7. Your Rights</h2>
					<p>You may have rights to access, correct, delete, restrict, or export your data, depending on your jurisdiction. To exercise these rights, contact us at <strong>[CONTACT EMAIL]</strong>.</p>

					<h2 className="h4 mt-4">8. Changes</h2>
					<p>We may update this Privacy Policy from time to time. We will post the updated version here with a new “Last updated” date.</p>

					<h2 className="h4 mt-4">9. Contact</h2>
					<p>If you have questions, contact us at:</p>
					<ul>
						<li>Email: <strong>[CONTACT EMAIL]</strong></li>
						<li>Address: <strong>[ADDRESS]</strong></li>
					</ul>
				</section>
			</div>
		</MainLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const data = await API.SESSION.fetchCurrentSession(context.req.headers.cookie || '');
	return { props: { user: data.user } };
}