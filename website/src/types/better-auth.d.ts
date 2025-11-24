import type { Plan, Notification } from '@/types/generated/browser';

declare module 'better-auth' {
  export interface User {
    id: string
    name: string | null
    email: string
    image: string | null
    emailVerified: boolean
    languageCode: string
    createdAt: Date
    updatedAt: Date
    totalStorageSize: number
    role: string
    notifications: Notification[]
    plan: Plan
    twoFactorEnabled: boolean
  }
}

declare module 'better-auth/client' {
  export interface Session {
    user: import('better-auth').User & User
  }
}