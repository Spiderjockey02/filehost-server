import { AdminUser } from '..';

export interface cacheStats {
  files: {
    size: number
    max: number
    ttl: number
  }
  users: {
    size: number
    max: number
    ttl: number
  }
  userHistory: {
    size: number
    max: number
    ttl: number
  }
  sessions: {
    size: number
    max: number
    ttl: number
  }
}

export interface thumbnailStats {
  sizeInBytes: number
  count: number
}

export interface AdminUserIdProps {
  isLoading: boolean
  user: AdminUser | null
}
