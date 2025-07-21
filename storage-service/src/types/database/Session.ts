import { Prisma } from '@prisma/client';

export type FullSession = Prisma.SessionGetPayload<{
  include: {
    user: {
      include: {
        plan: true
      }
    }
  }
}>