export interface AdminStorageIdPageProps {
  storageId: string
}

export interface AdminUserIdPageProps {
  userId: string
}

export interface FilePageProps {
  path: string
}

export interface HomePageProps {
	totalUserCount: number
	storageUsed: number
	totalFileCount: number
}

export interface SearchPageProps {
  query: {
    query: string
    fileType: string
    dateUpdated: string
  }
}

export type viewTypeTypes = 'List' | 'Tiles';

export type timeInterval = 'daily' | 'monthly' | 'yearly' | 'hourly'

export type adminSidebarTabs = 'dashboard' | 'users' | 'files' | 'system' | 'network' | 'storage' | 'subscriptions' | 'logs'