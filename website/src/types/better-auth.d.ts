import type { Group, Notification } from '@prisma/client';

declare module 'better-auth' {
  export interface User {
    id: string
    name: string | null
    email: string
    emailVerified: boolean
    languageCode: string
    createdAt: Date
    updatedAt: Date
    totalStorageSize: number
    role: string
    notifications: Notification[]
    group: Group | null
    banned: boolean
  }
}

declare module 'better-auth/client' {
  export interface Session {
    user: import('better-auth').User & User
  }
}