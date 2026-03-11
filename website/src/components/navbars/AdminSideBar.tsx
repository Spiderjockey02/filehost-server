import { faCogs, faFile, faFileLines, faHardDrive, faLaughWink, faSackDollar, faTachometerAlt, faUsers, faWifi } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminSideBarProps } from '@/types/Components/Navbars';
import Link from 'next/link';

export default function AdminSideBar({ activeTab, showSidebar }: AdminSideBarProps) {
	return (
		<ul className="navbar-nav bg-primary sidebar sidebar-dark accordion" id="accordionSidebar" style={{ color: 'white', minHeight: '100vh', display: showSidebar ? 'block' : 'none' }}>
			<Link className="sidebar-brand d-flex align-items-center justify-content-center" href="/" style={{ color: 'white' }}>
				<div className="sidebar-brand-icon rotate-n-15">
					<FontAwesomeIcon icon={faLaughWink} />
				</div>
				<div className="sidebar-brand-text mx-3">{process.env.NEXT_PUBLIC_COMPANY_NAME}</div>
			</Link>
			<hr className="sidebar-divider my-0" />
			<li className={`nav-item ${activeTab == 'dashboard' ? 'active' : ''}`}>
				<Link className="nav-link" href="/admin">
					<FontAwesomeIcon icon={faTachometerAlt} />
					<span> Dashboard</span>
				</Link>
			</li>
			<hr className="sidebar-divider" />
			<li className={`nav-item ${activeTab == 'users' ? 'active' : ''}`}>
				<Link className="nav-link" href="/admin/users">
					<FontAwesomeIcon icon={faUsers} />
					<span> Users</span>
				</Link>
			</li>
			<li className={`nav-item ${activeTab == 'files' ? 'active' : ''}`}>
				<Link className="nav-link" href="/admin/files">
					<FontAwesomeIcon icon={faFile} />
					<span> Files</span>
				</Link>
			</li>
			<li className={`nav-item ${activeTab == 'system' ? 'active' : ''}`}>
				<Link className="nav-link" href="/admin/system">
					<FontAwesomeIcon icon={faCogs} />
					<span> System</span>
				</Link>
			</li>
			<li className={`nav-item ${activeTab == 'network' ? 'active' : ''}`}>
				<Link className="nav-link" href="/admin/network">
					<FontAwesomeIcon icon={faWifi} />
					<span> Network</span>
				</Link>
			</li>
			<li className={`nav-item ${activeTab == 'storage' ? 'active' : ''}`}>
				<Link className="nav-link" href="/admin/storage">
					<FontAwesomeIcon icon={faHardDrive} />
					<span> Storage</span>
				</Link>
			</li>
			<li className={`nav-item ${activeTab == 'subscriptions' ? 'active' : ''}`}>
				<Link className="nav-link" href="/admin/subscriptions">
					<FontAwesomeIcon icon={faSackDollar} />
					<span> Subscriptions</span>
				</Link>
			</li>
			<li className={`nav-item ${activeTab == 'logs' ? 'active' : ''}`}>
				<Link className="nav-link" href="/admin/logs">
					<FontAwesomeIcon icon={faFileLines} />
					<span> Audit logs</span>
				</Link>
			</li>
			<hr className="sidebar-divider" />
		</ul>
	);
}
