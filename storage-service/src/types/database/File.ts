import { type FileType, Prisma, File } from '@/types/generated/client';

export interface CreateFileParams {
  name: string
  size: bigint
  mimetype: string | null
  parentId?: string
  userId: string
  type?: FileType
  storageId: string
}

export type FileWithPath = {
  path: string
} & File

export interface UpdateFileParams {
  id: string
  name?: string
  size?: bigint
  deletedAt?: Date | null
  parentId?: string
  children?: CreateFileParams
  storageId?: string
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