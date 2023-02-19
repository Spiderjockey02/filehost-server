import { Prisma } from '@prisma/client';

export type fileType = 'file' | 'directory'

export type fileItem = {
  path: string
  name: string
  isSymbolicLink: boolean
  size: number
  extension: string
  type: fileType
  modified: number
  children: fileItem[]
  url: string
}
const userWithPosts = Prisma.validator<Prisma.UserArgs>()({
	include: { recentFiles: true, group: true },
});


export type User = Prisma.UserGetPayload<typeof userWithPosts>
