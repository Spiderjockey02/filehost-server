import { UserHistoryWithFile } from '../database';
import type { User } from 'better-auth';

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
  user?: User | null
}

export interface RecentNavbarProps {
  files: UserHistoryWithFile[];
}

export interface AdminNavbarProps {
  showSidebar: boolean;
  setShowSidebar: (arg0: boolean) => void;
  user: User
}

export interface AutoComplete {
  name: string
  path: string
}