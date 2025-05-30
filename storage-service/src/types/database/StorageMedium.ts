import { StorageType } from '@prisma/client';

export interface createStorageMedium {
  type: StorageType
  name: string
  basePath: string
  latitude: number
  longitude: number
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
  latitude?: number
  longitude?: number
  endpoint?: string
  maxSize?: number
  usedSize?: number
  isPrivate?: boolean
  thumbnailOnly?: boolean
  avatarOnly?: boolean
}
