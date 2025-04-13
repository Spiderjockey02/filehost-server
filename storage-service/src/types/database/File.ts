import { FileType, Prisma } from '@prisma/client';

export interface createFile {
  path: string
  name: string
  size: bigint
  mimetype: string | null
  parentId?: string
  userId: string
  type?: FileType
}

export interface updateFile {
  id: string
  path?: string
  name?: string
  size?: bigint
  deletedAt?: Date | null
  parentId?: string
  children?: createFile
}

export interface updateFilePath {
  userId: string
  oldPath: string
  newPath: string
}

export type FullFile = Prisma.FileGetPayload<{
  include?: {
    children: true
  }
  _count?: {
    children: number
  }
}>