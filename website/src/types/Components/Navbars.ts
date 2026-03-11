import type { UserHistoryWithFile } from '../database';
import type { adminSidebarTabs } from '../pages';
import type { Session } from '@/auth/server';
import type { ReactElement } from 'react';

export type viewTypeTypes = 'List' | 'Tiles';

export interface BreadcrumbNavProps {
  path: string
  isFile: boolean
  parentId: string
	setviewType: (viewType: 'List' | 'Tiles') => void
	viewType: viewTypeTypes
}

export interface FileSideBarProps extends FileNavBarProps {
  activeTab: 'files' | 'recent' | 'bin' | 'gallery'
}

export interface HoverElementProps {
	title: string
	children: ReactElement
}

export interface AdminSideBarProps {
  activeTab: adminSidebarTabs
  showSidebar: boolean
}

export interface FileNavBarProps {
  user: Session['user']
}

export interface HomeNavbarProps {
  user: Session['user'] | null
}

export interface RecentNavbarProps {
  files: UserHistoryWithFile[];
}

export interface AdminNavbarProps {
  showSidebar: boolean;
  setShowSidebar: (arg0: boolean) => void;
  user: Session['user']
}

export interface AutoComplete {
  name: string
  path: string
}