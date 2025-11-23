import type { MainLayoutProps } from '@/types/Components/Layout';
import { Footer, HomeNavbar } from '@/components';
import Head from 'next/head';

export default function MainLayout({ children, user, tabName }: MainLayoutProps) {
	return (
		<>
			<HomeNavbar user={user} />
			<Head>
				<title>{`${process.env.NEXT_PUBLIC_COMPANY_NAME} - ${tabName}`}</title>
			</Head>
			<div style={{ paddingTop: '60px' }}>
				{children}
			</div>
			<Footer />
		</>
	);
}