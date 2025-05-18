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
  rawUserGrowth: {
    [key: string]: number
  }
  rawUploadGrowth: {
    [key: string]: number
  }
}

export interface AdminUserPageProps {
  users: UserWithCount[]
  months: {
    [key: string]: number
  }
  newUsers: number
  langaugeCodes: {
    [key: string]: number
  }
  emails: {
    [key: string]: number
  }
  rawUserGrowth: {
    [key: string]: number
  }
  signupSource: {
    [key: string]: number
  }
  retention: {
    sessions: {
      [key: string]: number
    }
    files: {
      [key: string]: number
    }
  }
  userStats: {
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