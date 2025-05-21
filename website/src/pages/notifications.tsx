import { authClient } from '@/auth/client';
import { auth } from '@/auth/server';
import MainLayout from '@/layouts/main';
import { User } from 'better-auth';
import { GetServerSidePropsContext } from 'next';

export default function Notifications() {
	const { data: session } = authClient.useSession();
	if (session == null) return null;

	return (
		<MainLayout user={session.user as User} tabName={`Notifications (${session.user?.notifications.length})`}>
			<div style={{ minHeight: '68vh' }}>
				<h1 className="text-center">Notifications ({session.user?.notifications.length})</h1>
				<div className="accordion" id="accordionExample">
					{session.user?.notifications.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((notification) => (
						<div className="accordion-item" key={notification.id}>
							<h2 className="accordion-header">
								<button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={notification.id} aria-expanded="true" aria-controls={notification.id}>
									{notification.title}
								</button>
							</h2>
							<div id={notification.id} className="accordion-collapse collapse show" data-bs-parent="#accordionExample">
								<div className="accordion-body">
									{notification.text}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</MainLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await auth.api.getSession({
		headers: new Headers({
			cookie: context.req.headers.cookie || '',
		}),
	});

	// Only show this page if they are logged in
	if (session == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		return { props: {} };
	}
}