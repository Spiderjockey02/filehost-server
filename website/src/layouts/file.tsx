import { FileNavBar, FileSideBar } from '@/components';
import { FileSideBarProps } from '@/types/Components/Navbars';
import Head from 'next/head';
import { ReactNode } from 'react';

interface Props extends FileSideBarProps {
  children: ReactNode
	tabName?: string
}

export default function FileLayout({ children, user, activeTab, tabName }: Props) {
	return (
		<div className="wrapper" style={{ height: '100dvb', blockSize: '100dvb', overflow: 'hidden' }}>
			<Head>
				<title>{process.env.NEXT_PUBLIC_COMPANY_NAME} - {tabName}</title>
			</Head>
			<FileSideBar user={user} activeTab={activeTab} />
			<div className="container-fluid" style={{ overflowY: 'scroll', padding: '0 6px' }}>
				<FileNavBar user={user} />
				<div className="container-fluid" style={{ padding: '0' }}>
					{children}
				</div>
			</div>
		</div>
	);
}