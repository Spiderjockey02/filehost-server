import { Prisma } from '@/types/generated/client';

export type FullSession = Prisma.SessionGetPayload<{
  include: {
    user: {
      include: {
        plan: true
      }
    }
  }
}>