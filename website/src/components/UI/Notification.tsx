import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { NotificationProps } from '@/types/Components/UI';
import { useIsMobile } from '../Hooks/IsMobile';
import en from 'javascript-time-ago/locale/en';
import { authClient } from '@/auth/client';
import TimeAgo from 'javascript-time-ago';
import Link from 'next/link';
import axios from 'axios';

// Create formatter (English).
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

export default function NotificationBell({ notifications }: NotificationProps) {
	const { refetch } = authClient.useSession();
	const isMobile = useIsMobile();

	async function deleteNotification(id: string) {
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
			<div className="dropdown-menu dropdown-menu-end" style={{ width: '300px' }}>
				<h3 className="dropdown-header">Notifications - {notifications.length}</h3>
				{
					notifications.length > 0 ? (
						notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notification, index) => (
							<div key={index} className="d-flex align-items-center px-3 py-2 border-bottom position-relative">
								<div className="flex-grow-1">
									<h6 className="mb-1 fw-bold">{notification.title}</h6>
									{notification.url ?
										<>
											<Link className='mb-1 text-muted small' style={{ textDecoration: 'none' }} href={notification.url}>{notification.text}</Link>
											<br />
										</>
										:
										<p className="mb-1 text-muted small">{notification.text}</p>
									}
									<span className="text-primary small">{timeAgo.format(new Date().getTime() - (new Date().getTime() - new Date(notification.createdAt).getTime()))}</span>
									<button className="btn-close position-absolute top-0 end-0" onClick={() => deleteNotification(notification.id)}></button>
								</div>
							</div>
						))
					) : (
						<p className="dropdown-item text-center text-muted">You currently have no notifications.</p>
					)
				}
			</div>
		</li>
	);
}