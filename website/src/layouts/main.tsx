import { Footer, HomeNavbar } from '@/components';
import type { User } from 'better-auth';
import Head from 'next/head';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
	user?: User | null
	tabName?: string
}

export default function MainLayout({ children, user, tabName }: Props) {
	return (
		<>
			<HomeNavbar user={user} />
			<Head>
				<title>{process.env.NEXT_PUBLIC_COMPANY_NAME} - {tabName}</title>
			</Head>
			<div style={{ paddingTop: '60px' }}>
				{children}
			</div>
			<Footer />
		</>
	);
}