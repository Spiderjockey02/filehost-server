import { DatabaseBackup, StringNumberObj } from '.';
import { StorageWithCounts } from './database';

export interface AdminPageProps {
  stats: {
    users: {
      total: number
      active: number
    },
    storage: {
      total: number
      free: number
      totalFiles: number
    }
    memory: {
      total: number
      using: number
    }
    uptime: number
  }
  error?: string
}

export interface AdminUserPageProps {
 emails: StringNumberObj
 signupSource: StringNumberObj
  userStats: {
    total: number
    new: number
    active:number
    avgstorageUsage: number
    banned: number
    admins: number
  }
  error?: string
}

export interface AdminSystemPageProps {
  error: string
  stats: {
    memory: {
      using: number
      total: number
    },
    uptime: number
    logs: {
      totalByteSize: number
      count: number
    },
    backup: DatabaseBackup | Record<never, never>
    network: number
  }
}

export interface AdminStoragePageProps {
  error: string
  storages: StorageWithCounts[]
  avgFileCount: number
  avgStorageUsage: number
  MediumCounts: {
    [key: string]: number
  }
}

interface Methods {
  method: string
  count: number
}

interface Status {
  status: number
  count: number
}

export interface AdminNetworkPageProps {
  error?: string
  network: {
    incomingBytes: number
    outgoingBytes: number
  }
  methods: Methods[]
  status: Status[]
  duration: number
  total: number
  history: StringNumberObj
}

export interface AdminFilesPageProps {
  files: number
  folders: number
  avgFileSize: number
  deletedFiles: number
  newFiles: number
  totalStorageSize: number
  mostCommonFileTypes: StringNumberObj
  days: StringNumberObj
  categories: StringNumberObj
  error?: string
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

export type requestTimeFrames = 'daily' | 'monthly' | 'yearly' | 'hourly'

export type adminSidebarTabs = 'dashboard' | 'users' | 'files' | 'organisations' | 'logs' | 'payments' | 'network' | 'storage'