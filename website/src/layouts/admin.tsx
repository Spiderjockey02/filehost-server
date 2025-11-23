import type { AdminLayoutProps } from '@/types/Components/Layout';
import { AdminSideBar, AdminNavBar } from '@/components';
import { useState } from 'react';
import Head from 'next/head';

export default function AdminLayout({ children, user, activeTab, tabName }: AdminLayoutProps) {
	const [showSidebar, setShowSidebar] = useState(true);

	return (
		<div className="wrapper" style={{ height: '100dvb', blockSize: '100dvb', overflow: 'hidden' }}>
			<Head>
				<title>{`${process.env.NEXT_PUBLIC_COMPANY_NAME} - ${tabName}`}</title>
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