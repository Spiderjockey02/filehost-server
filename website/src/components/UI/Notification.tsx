import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faClock, faInbox } from '@fortawesome/free-solid-svg-icons';
import { NotificationProps } from '@/types/Components/UI';
import { useIsMobile } from '../Hooks/IsMobile';
import { authClient } from '@/auth/client';
import Link from 'next/link';
import axios from 'axios';
import { format } from '@/utils/functions';
import { SyntheticEvent } from 'react';

export default function NotificationBell({ notifications }: NotificationProps) {
	const { refetch } = authClient.useSession();
	const isMobile = useIsMobile();

	async function deleteNotification(e: SyntheticEvent, id: string) {
		e.stopPropagation();
		try {
			await axios.delete(`/api/session/notifications/${id}`);
			refetch();
		} catch (error) {
			console.log(error);
		}
	}

	return (
		<li className="navbar-nav dropdown">
			{
				isMobile ?
					<Link className="nav-item text-dark nav-link" href="/notifications">
						<FontAwesomeIcon icon={faBell} />
						{
							notifications.length > 0 ?
								<span className="position-absolute start-100 translate-middle badge rounded-pill bg-danger">
									{notifications.length}
								</span>
								: null
						}
					</Link>
					:
					<a className="nav-item text-dark nav-link" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<FontAwesomeIcon icon={faBell} />
						{
							notifications.length > 0 ?
								<span className="position-absolute start-100 translate-middle badge rounded-pill bg-danger">
									{notifications.length}
								</span>
								: null
						}
					</a>
			}
			<div className="dropdown-menu dropdown-menu-end shadow-sm p-0" style={{ width: '320px' }}>
				<h6 className="dropdown-header bg-light fw-semibold">
					<FontAwesomeIcon icon={faBell} className='me-2' />
					Notifications - {notifications.length}
				</h6>

				{notifications.length > 0 ? (
					notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notification, index) => (
						<div key={index} className="px-3 py-2 d-flex justify-content-between align-items-start border-bottom position-relative">
							<div className="me-2 w-100 flex-grow-1">
								<h6 className="mb-1 fw-bold">
									{notification.url ? (
										<Link href={notification.url} className="text-decoration-none text-dark">
											{notification.title}
										</Link>
									) : (
										notification.title
									)}
								</h6>
								<p className="mb-1 text-muted small text-wrap">
									{notification.text}
								</p>
								<small>
									<FontAwesomeIcon icon={faClock} className='me-1' />
									{format(new Date().getTime() - (new Date().getTime() - new Date(notification.createdAt).getTime()))}
								</small>
							</div>
							<button className="btn btn-sm btn-close ms-2 position-absolute top-25 end-0 translate-middle-y" aria-label="Close" onClick={(e) => deleteNotification(e, notification.id)} />
						</div>
					))
				) : (
					<div className="text-center text-muted py-3">
						<FontAwesomeIcon icon={faInbox} className='me-2' />
						No new notifications
					</div>
				)}
			</div>
		</li>
	);
}