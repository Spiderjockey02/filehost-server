import { Footer, HomeNavbar } from '@/components';
import type { User } from 'better-auth';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
	user: User | null
}

export default function MainLayout({ children, user }: Props) {
	return (
		<>
			<HomeNavbar user={user} />
			<div style={{ paddingTop: '60px' }}>
				{children}
			</div>
			<Footer />
		</>
	);
}