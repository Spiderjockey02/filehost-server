import { FileNavBar, Sidebar } from '@/components';
import { FileSideBarProps } from '@/types/Components/Navbars';
import { User } from 'better-auth';
import { ReactNode } from 'react';

interface Props extends FileSideBarProps {
  children: ReactNode
}

export default function FileLayout({ children, user, active }: Props) {
	return (
		<div className="wrapper" style={{ height:'100vh' }}>
			<Sidebar user={user} active={active} />
			<div className="container-fluid" style={{ maxHeight: '100vh', overflowY: 'scroll', padding: '0 6px' }}>
				<FileNavBar user={user} />
				<div className="container-fluid" style={{ padding: '0' }}>
					{children}
				</div>
			</div>
		</div>
	);
}