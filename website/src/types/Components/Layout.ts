import type { CSSProperties, ReactNode } from 'react';
import type { adminSidebarTabs } from '..';
import type { PageProps } from '../pages';

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

export interface AdminLayoutProps extends PageProps {
	children: ReactNode;
	activeTab: adminSidebarTabs
	tabName?: string
}

export interface FileLayoutProps extends PageProps {
  children: ReactNode
	tabName?: string
	activeTab: 'files' | 'recent' | 'bin' | 'gallery'
}

export interface MainLayoutProps extends PageProps {
  children: ReactNode;
	tabName?: string
}