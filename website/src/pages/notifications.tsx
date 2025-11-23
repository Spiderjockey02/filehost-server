import { faArrowRight, faBell, faCheckCircle, faClock, faInfoCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import MainLayout from '@/layouts/main';
import type { User } from 'better-auth';
import Link from 'next/link';
import axios from 'axios';

export default function Notifications() {
	const { data: session, refetch } = authClient.useSession();

	async function deleteNotification(id: string) {
		try {
			await axios.delete(`/api/session/notifications/${id}`);
			refetch();
		} catch (error) {
			console.log(error);
		}
	}

	if (session == null) return null;
	return (
		<MainLayout user={session.user as User} tabName={`Notifications (${session.user?.notifications.length})`}>
			<div className="container py-4" style={{ minHeight: '70vh' }}>
				<h1 className="text-center mb-4">
					<FontAwesomeIcon icon={faBell} className='me-2' />
					Notifications ({session.user?.notifications.length})
				</h1>
				{session.user?.notifications.length === 0 ?
					<div className="alert alert-info text-center" role="alert">
						<FontAwesomeIcon icon={faCheckCircle} className="me-2"/>
						You&apos;re all caught up! No new notifications.
					</div>
				 : <div className="row row-cols-1 g-3">
						{session.user?.notifications
							.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
							.map((notification) => (
								<div className="col" key={notification.id}>
									<div className="card shadow-sm border-0">
										<div className="card-body">
											<h5 className="card-title mb-2">
												<FontAwesomeIcon icon={faInfoCircle} className="text-primary me-2" />
												{notification.title}
											</h5>
											<p className="card-text text-muted small mb-2">
												<FontAwesomeIcon icon={faClock} className='me-1' />
												{new Date(notification.createdAt).toLocaleString()}
											</p>
											<p className="card-text">{notification.text}</p>
											{notification.url && (
												<Link href={notification.url} className="btn btn-sm btn-outline-primary mt-2">
													<FontAwesomeIcon icon={faArrowRight} className="me-1" />
													View Details
												</Link>
											)}
											&nbsp;
											<button className="btn btn-sm btn-outline-danger mt-2" onClick={() => deleteNotification(notification.id)}>
												<FontAwesomeIcon icon={faTrash} className="me-1" />
												Delete
											</button>
										</div>
									</div>
								</div>
							))}
					</div>
				}
			</div>
		</MainLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
		headers: {
			cookie: context.req.headers.cookie || '',
		},
	});

	const data = await res.json();
	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		// Get the path from the URL
		const path = [context.params?.files].flat();
		return { props: { path: path.join('/') } };
	}
}