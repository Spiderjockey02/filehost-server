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
    activity: true
  }
}>

export type DeletedFile = {
  deletedAt: Date
} & File

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

export type UserAgentWithCounts = Prisma.UserAgentGetPayload<{
  include: {
    _count: {
      select: {
        activity: true
      }
    }
  }
}>

export type FullAuditLogListener = Prisma.AuditLogListenerGetPayload<{
  include: {
    events: true
  }
}>
