import { UserBans } from '@prisma/client';
import { AdminUser } from '..';

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

export interface AdminUserIdProps {
  isLoading: boolean
  user: AdminUser | null
  bannedStatus: UserBans | null
  isCurrentUser: boolean
}
