import { File, Prisma } from '@prisma/client';

export type UserHistoryWithFile = Prisma.RecentlyViewedFileGetPayload<{
  include: {
    file: true
  }
}>

export type FileWithDeepChildren = Prisma.FileGetPayload<{
  include: {
    children: {
      include: {
        _count: {
          select: {
            children: true
          }
        }
      }
    }
    _count: {
      select: {
        children: true
      }
    }
  },
}>

export type FileWithChildren = Prisma.FileGetPayload<{
  include: {
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
    plan: true
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
        logs: true
      }
    }
  }
}>

export type FullAuditLogListener = Prisma.AuditLogListenerGetPayload<{
  include: {
    events: true
  }
}>
