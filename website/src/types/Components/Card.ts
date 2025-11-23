import { Prisma, UserBans } from '@prisma/client';
import { AdminUser } from '..';

export interface AdminListActivitiesCardProps {
	userId?: string;
}

export interface AdminListSessionsCardProps {
  userId: string
	isAdmin: boolean
}

export interface AdminManageUsersCardProps {
	storageId?: string;
}

export interface ManageUsersFilterProps {
  sortOrder: Prisma.SortOrder
  sortBy: 'createdAt' | 'lastActive' | 'uploadedFiles' | 'name'
}

export interface ListAuditLogsFilterProps {
  sortOrder: Prisma.SortOrder
  eventName: string
}

export interface AdminManageUserNotficationsCardProps {
  userId: string
}

export interface cacheStat {
  size: number
  max: number
  ttl: number
}

export interface cacheStats {
  files: cacheStat
  users: cacheStat
  userHistory: cacheStat
  sessions: cacheStat
  mimeTypes: cacheStat
  ips: cacheStat
  userAgents: cacheStat
}

export interface AdminManageUserCardProps {
  isLoading: boolean
  user: AdminUser | null
  bannedStatus: UserBans | null
  isCurrentUser: boolean
}
