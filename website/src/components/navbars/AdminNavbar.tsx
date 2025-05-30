import { NotificationBell } from '@/components';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { faX, faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AdminNavbarProps } from '@/types/Components/Navbars';

export default function AdminNavBar({ user, showSidebar, setShowSidebar }: AdminNavbarProps) {
	const router = useRouter();

	return (
		<nav className="navbar navbar-expand navbar-light bg-light sticky-top shadow" style={{ paddingLeft:'5px' }}>
			<div className="navbar-collapse w-100 dual-collapse2">
				<ul className="navbar-nav me-auto mb-2 mb-lg-0">
					<a type="button" className="nav-link" onClick={() => setShowSidebar(!showSidebar)}>
						<FontAwesomeIcon icon={showSidebar ? faX : faBars} />
					</a>
				</ul>
				<ul className="navbar-nav ml-auto">
					<NotificationBell notifications={user.notifications} />
					&nbsp;
					<li className="nav-item">
						<a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							<Image src={user.image ?? `/avatar/${user.id}`} width={25} height={25} className="rounded-circle" alt="User avatar" /> {user.name}
						</a>
						<div className="dropdown-menu dropdown-menu-end">
							<Link className="dropdown-item text-dark" href="/settings">Settings</Link>
							<Link className="dropdown-item text-dark" href="/files">My files</Link>
							{user.role == 'admin' && <Link className="dropdown-item text-dark" href="/admin">Admin</Link>}
							<div className="dropdown-divider"></div>
							<a className="dropdown-item" href="#" onClick={() => authClient.signOut({ fetchOptions: {
								onSuccess: () => {
									router.push('/login');
								},
							} })} id="logout">Logout</a>
						</div>
					</li>
				</ul>
			</div>
		</nav>
	);
}
