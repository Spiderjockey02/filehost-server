import type { FileLayoutProps } from '@/types/Components/Layout';
import { FileNavBar, FileSideBar } from '@/components';
import Head from 'next/head';

export default function FileLayout({ children, user, activeTab, tabName }: FileLayoutProps) {
	return (
		<div className="wrapper" style={{ height: '100dvb', blockSize: '100dvb', overflow: 'hidden' }}>
			<Head>
				<title>{`${process.env.NEXT_PUBLIC_COMPANY_NAME} - ${tabName}`}</title>
			</Head>
			<FileSideBar user={user} activeTab={activeTab} />
			<div className="container-fluid" style={{ overflowY: 'scroll', padding: '0 6px' }} id="bodyForScroll">
				<FileNavBar user={user} />
				<div className="container-fluid" style={{ padding: '0' }} id="subBodyForScroll">
					{children}
				</div>
			</div>
		</div>
	);
}