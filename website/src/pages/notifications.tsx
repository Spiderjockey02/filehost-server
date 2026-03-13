import { faArrowRight, faBell, faCheckCircle, faClock, faInfoCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import type { PageProps } from '@/types/pages';
import { useEffect, useState } from 'react';
import { authClient } from '@/auth/client';
import MainLayout from '@/layouts/main';
import { Table } from '@/components';
import API from '@/services/api';
import Link from 'next/link';
import axios from 'axios';

export default function Notifications({ user }: PageProps) {
	const { refetch } = authClient.useSession();
	const [page, setPage] = useState(0);
	const { showToast } = useToast();

	const { data, isLoading, refetch: refreshTable, error } = useQuery({
		queryKey: ['notifications', page],
		queryFn: async ({ signal }) => API.SESSION.fetchUsersNotifications(signal),
		...queryOptions,
	});

	async function deleteNotification(id: string) {
		try {
			await axios.delete(`/api/session/notifications/${id}`);
			await Promise.all([refetch(), refreshTable()]);
		} catch (err) {
			console.log(err);
		}
	}

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	return (
		<MainLayout user={user} tabName={`Notifications (${isLoading ? '-1' : data?.total ?? 0})`}>
			<div className="container py-4" style={{ minHeight: '70vh' }}>
				<h1 className="text-center mb-4">
					<FontAwesomeIcon icon={faBell} className='me-2' />
					Notifications ({isLoading ? '-1' : data?.total ?? 0})
				</h1>
				{isLoading || data == null ? (
					<div className="alert alert-info text-center" role="alert">
						<FontAwesomeIcon icon={faCheckCircle} className="me-2"/>
						You&apos;re all caught up! No new notifications.
					</div>
				) :
					(
						<>
							<div className="row row-cols-1 g-3">
								{data.notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
							&nbsp;
							<Table.PaginationFooter isLoading={isLoading} total={data?.total ?? 0} page={page} setPage={setPage} />
						</>
					)
				}
			</div>
		</MainLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const data = await API.SESSION.fetchCurrentSession(context.req.headers.cookie || '');

	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		return { props: { user: data.user } };
	}
}