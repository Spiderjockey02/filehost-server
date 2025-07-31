import { FileType, Prisma } from '@prisma/client';

export interface createFile {
  path: string
  name: string
  size: bigint
  mimetype: string | null
  parentId?: string
  userId: string
  type?: FileType
  storageId: string
}

export interface updateFile {
  id: string
  path?: string
  name?: string
  size?: bigint
  deletedAt?: Date | null
  parentId?: string
  children?: createFile
  storageId?: string
}

export interface updateFilePath {
  userId: string
  parentId: string
  oldPath: string
  newPath: string
}

export interface fetchByOwner {
  userId: string
  type?: FileType
  isDeleted?: boolean
}

export type FullFile = Prisma.FileGetPayload<{
  include: {
    children: true
  }
  _count?: {
    children: number
  }
}>

export interface Pagination {
  page?: number
}