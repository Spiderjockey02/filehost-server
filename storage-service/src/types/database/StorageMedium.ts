import { Prisma, type StorageType } from '@/types/generated/client';
export type StorageDirection = 'DECRE' | 'INCRE' | 'SET'

export interface CreateMediumParams {
  type: StorageType
  name: string
  basePath: string
  location: string
  endpoint?: string | undefined
  maxSize?: bigint | undefined
  usedSize?: bigint | undefined
  avatarOnly?: boolean | undefined
}
export interface UpdateMediumParams {
  id: string
  name?: string | undefined
  basePath?: string | undefined
  location?: string | undefined
  endpoint?: string | undefined
  maxSize?: bigint | undefined
  usedSize?: bigint | undefined
  isPrivate?: boolean | undefined
  avatarOnly?: boolean | undefined
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