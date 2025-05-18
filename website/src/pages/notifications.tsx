import { authClient } from '@/auth/client';
import MainLayout from '@/layouts/main';
import { User } from 'better-auth';

export default function Notifications() {
	const { data } = authClient.useSession();
	if (data == null || data.user == null) return null;

	const user = data?.user as unknown as User;
	return (
		<MainLayout user={user}>
			<div style={{ minHeight: '68vh' }}>
				<h1 className="text-center">Notifications ({user.notifications.length})</h1>
				<div className="accordion" id="accordionExample">
					{user.notifications.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((notification) => (
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