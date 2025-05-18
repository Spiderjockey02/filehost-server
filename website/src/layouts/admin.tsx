import { AdminSideBar, AdminNavBar } from '@/components';
import type { User } from 'better-auth';
import Head from 'next/head';
import { ReactNode, useState } from 'react';

interface Props {
	children: ReactNode;
	user: User;
	activeTab: 'dashboard' | 'users' | 'files' | 'organisations' | 'logs' | 'payments'
	tabName?: string
}

export default function AdminLayout({ children, user, activeTab, tabName }: Props) {
	const [showSidebar, setShowSidebar] = useState(true);

	return (
		<div className="wrapper" style={{ height: '100dvb', blockSize: '100dvb', overflow: 'hidden' }}>
			<Head>
				<title>{process.env.NEXT_PUBLIC_COMPANY_NAME} - {tabName}</title>
			</Head>
			<AdminSideBar activeTab={activeTab} showSidebar={showSidebar} />
			<div className='container-fluid' style={{ overflowY: 'scroll', padding: '0' }}>
				<AdminNavBar user={user} showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
				<div className="container-fluid">
					{children}
				</div>
			</div>
		</div>
	);
}