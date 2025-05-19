import { StringNumberObj } from '.';
import { UserWithCount } from './database';

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
  rawUserGrowth: StringNumberObj
  rawUploadGrowth: StringNumberObj
}

export interface AdminUserPageProps {
  users: UserWithCount[]
  months: StringNumberObj
  newUsers: number
  langaugeCodes: StringNumberObj
  emails: StringNumberObj
  rawUserGrowth: StringNumberObj
  signupSource: StringNumberObj
  retention: {
    sessions: StringNumberObj
    files: StringNumberObj
  }
  userStats: {
    total: number
    new: number
    active:number
    avgstorageUsage: number
    banned: number
    admins: number
  }
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