import type { CSSProperties, ReactNode } from 'react';
import type { FileSideBarProps } from './Navbars';
import type { adminSidebarTabs } from '../pages';
import type { Session } from '@/auth/server';

export interface GridLayoutProps {
	readonly children?: ReactNode
	readonly className?: string
	readonly style?: CSSProperties
}

export interface ColumnProps extends ColProps, GridLayoutProps {}

export interface ColProps {
	xs?: number
	sm?: number
	md?: number
	lg?: number
	xl?: number
	xxl?: number
}

export type ColPrefix = 'xs' | 'sm' | 'md' | 'lg' | 'xl'| 'xxl'

export interface AdminLayoutProps {
	children: ReactNode;
	user: Session['user'];
	activeTab: adminSidebarTabs
	tabName?: string
}

export interface FileLayoutProps extends FileSideBarProps {
  children: ReactNode
	tabName?: string
}

export interface MainLayoutProps {
  children: ReactNode;
	user: Session['user'] | null
	tabName?: string
}