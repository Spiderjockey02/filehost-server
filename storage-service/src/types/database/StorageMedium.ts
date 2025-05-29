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
}