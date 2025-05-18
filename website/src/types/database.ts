import { File, Prisma } from '@prisma/client';

export type UserHistoryWithFile = Prisma.RecentlyViewedFileGetPayload<{
  include: {
    file: true
  }
}>

export type FileWithChildren = Prisma.FileGetPayload<{
  include: {
    children: true
    _count: {
      select: {
        children: true
      }
    }
  },
}>

export type FileWithCount = Prisma.FileGetPayload<{
 include: {
    _count: {
      select: {
        children: true
      }
    }
  }
}>

export type UserWithCount = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        files: true
      }
    }
  }
}>

export type DeletedFile = {
  deletedAt: Date
} & File