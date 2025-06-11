import { AdminUser } from '..';

interface cacheStat {
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

export interface thumbnailStats {
  sizeInBytes: number
  count: number
}

export interface AdminUserIdProps {
  isLoading: boolean
  user: AdminUser | null
}
