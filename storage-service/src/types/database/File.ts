import { type FileType, Prisma } from '@/types/generated/client';

export interface CreateFileParams {
  path: string
  name: string
  size: bigint
  mimetype: string | null
  parentId?: string
  userId: string
  type?: FileType
  storageId: string
}

export interface AddMetadataToFileParams {
  width?: number
  height?: number
  duration?: number
  frameRate?: number
  cameraModel?: string
  gpsLatitude?: number
  gpsLongitude?: number
  originalCreatedAt: Date
  codec?: string
  exif?: any
}

export interface UpdateFileParams {
  id: string
  path?: string
  name?: string
  size?: bigint
  deletedAt?: Date | null
  parentId?: string
  children?: CreateFileParams
  storageId?: string
}

export interface UpdateFilePathParams {
  userId: string
  parentId: string
  oldPath: string
  newPath: string
}

export interface FetchByOwnerParams {
  userId: string
  type?: FileType
  isDeleted?: boolean
}

export interface SearchForFilesParams {
  userId: string
  query: string
  type?: FileType | undefined
}

export type FullFile = Prisma.FileGetPayload<{
  include: {
    children: true
  }
  _count?: {
    children: number
  }
}>

export interface FetchFileMediaTypesParams {
  grouped?: boolean | undefined
  type?: string | undefined
}