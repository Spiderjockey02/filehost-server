import { User } from 'better-auth';
import { RecentlyViewed } from '..';

export type viewTypeTypes = 'List' | 'Tiles';

export interface BreadcrumbNavProps {
  path: string
  isFile: boolean
  parentId: string
	setviewType: (viewType: 'List' | 'Tiles') => void
	viewType: viewTypeTypes
}

export interface FileSideBarProps extends FileNavBarProps {
  activeTab: 'files' | 'recent' | 'bin'
}

export interface AdminSideBarProps {
  activeTab: 'dashboard' | 'users' | 'files' | 'organisations' | 'logs' | 'payments'
  showSidebar: boolean
}

export interface FileNavBarProps {
  user: User
}

export interface HomeNavbarProps {
  user: User | null
}

export interface RecentNavbarProps {
  files: RecentlyViewed[];
}