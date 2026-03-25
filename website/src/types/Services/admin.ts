import type { Account, AuditLog, HTTPMethod, UserBans, Notification } from '../generated/browser';
import type { AdminUser, DatabaseBackup, StringNumberObj } from '..';
import type { StorageWithCounts, UserWithCount } from '../database';

// Types for Admin Logs Services
export interface GetAuditLogActivityResult {
  [key: string]: {
    user: number
    file: number
    storage: number
    system: number
    session: number
  }
}

export interface GetLogListResult {
  logs: AuditLog[]
  total: number
}

export interface GetFileByNameResult {
  logs: string[]
  total: number
}

export interface GetLogTypesResult {
  resourceTypes: {
    user: number
    file: number
    storage: number
    system: number
    session: number
  },
  successRates: {
    true: number
    false: number
  }
}

export interface GetAuditLogsResult {
  logs: AuditLog[]
  total: number
}

// Types for Admin Storage Services
export interface GetStorageListResult {
  storages: StorageWithCounts[]
  avgFileCount: number
  avgStorageUsage: number
}

export interface GetStorageTypesResult {
  MediumCounts: {
    [key: string]: number
  }
}

// Types for Admin User Services
export interface GetAdminUserIdResult {
  user: AdminUser
  bannedStatus: UserBans | null
}

export interface GetAccountsByUserIdResult {
  accounts: Account[]
}

export interface GetNotificationsByUserIdParams {
  userId: string
  page: number
}

export interface GetNotificationsByUserIdResult {
  notifications: Notification[]
  total: number
}

export interface GetAllResult {
  users: UserWithCount[]
  total: number
}

type StorageMediumStats = {
  name: string
  used: number
  total: number
}

export interface GetAdminStatsResult {
  storage: {
    totalFiles: number
    medium: StorageMediumStats[]
  }
  memory: {
    using: number
    total: number
  }
  cpu: {
    total: number
    avg: number[]
  }
  users: {
    total: number
    active: number
    new: number
  }
  uptime: number
}

export interface GetFileStatsResult {
  files: number
  folders: number
  avgFileSize: number
  mostCommonFileTypes: StringNumberObj
  deletedFiles: number
  newFiles: number
  totalStorageSize: number
}

export interface GetFileCategoriesResult {
  categories: {
    'Tiny (0-10 KB)': number
    'Small (10 KB - 1 MB)': number
    'Medium (1 MB - 50 MB)': number
    'Large (50 MB - 500 MB)': number
    'Very Large (500 MB - 1 GB)': number
    'Huge (> 1 GB)': number
  }
}

type NetworkMethodStats = {
  method: HTTPMethod
  _count: number
}

type NetworkStatusStats = {
  code: number
  _count: number
}

export interface GetNetworkStatsResult {
  network: {
    incomingBytes: number
    outgoingBytes: number
  }
  methods: NetworkMethodStats[]
  status: NetworkStatusStats[]
  duration: number
  total: number
}

export interface GetSubscriptionStatsResult {
  payingUsers: number
  newCustomers: number
  mostPopular: string
  totalRevenue: number
}

export interface GetSystemStatsResult {
  memory: {
    using: number,
    total: number
  },
  uptime: number,
  logs: {
    totalByteSize: number,
    count: number
  },
  network: number,
  backup: DatabaseBackup
}

export interface GetUserStatsResult {
  total: number
  active: number
  new: number
  avgstorageUsage: number
  banned: number
  admins: number
}

export interface GetUserRetentionResults {
  files: StringNumberObj
  sessions: StringNumberObj
}

export interface GetNetworkTrafficResult {
  [key: string]: {
    incomingBytes: number
    outgoingBytes: number
  }
}