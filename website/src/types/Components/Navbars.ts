import type { viewTypeTypes, adminSidebarTabs } from '..';
import type { UserHistoryWithFile } from '../database';
import type { Session } from '@/auth/server';
import type { PageProps } from '../pages';
import type { ReactElement } from 'react';


export interface BreadcrumbNavProps {
  path: string
  isFile: boolean
  parentId: string
	setviewType: (viewType: viewTypeTypes) => void
	viewType: viewTypeTypes
}

export interface FileSideBarProps {
  activeTab: 'files' | 'recent' | 'bin' | 'gallery'
  user: Session['user']
}

export interface HoverElementProps {
	title: string
	children: ReactElement
}

export interface AdminSideBarProps {
  activeTab: adminSidebarTabs
  showSidebar: boolean
}

export interface RecentNavbarProps {
  files: UserHistoryWithFile[];
}

export interface AdminNavbarProps extends PageProps {
  showSidebar: boolean;
  setShowSidebar: (arg0: boolean) => void;
}