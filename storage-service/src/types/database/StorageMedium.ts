import { Prisma, StorageType } from '@/types/generated/client';

export interface createStorageMedium {
  type: StorageType
  name: string
  basePath: string
  location: string
  endpoint?: string
  maxSize?: bigint
  usedSize?: bigint
  thumbnailOnly?: boolean
  avatarOnly?: boolean
}
export interface updateStorageMedium {
  id: string
  name?: string
  basePath?: string
  location?: string
  endpoint?: string
  maxSize?: bigint
  usedSize?: bigint
  isPrivate?: boolean
  thumbnailOnly?: boolean
  avatarOnly?: boolean
}

export type StorageWithCounts = Prisma.StorageMediumGetPayload<{
  include: {
    _count: {
      select: {
        users: true
        files: true
      }
    }
  }
}>