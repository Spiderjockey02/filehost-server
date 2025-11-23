import { User } from 'better-auth';
import { CSSProperties, ReactNode } from 'react';
import { adminSidebarTabs } from '../pages';
import { FileSideBarProps } from './Navbars';

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
	user: User;
	activeTab: adminSidebarTabs
	tabName?: string
}

export interface FileLayoutProps extends FileSideBarProps {
  children: ReactNode
	tabName?: string
}

export interface MainLayoutProps {
  children: ReactNode;
	user?: User | null
	tabName?: string
}