import { BetterAuthOptions } from 'better-auth';

declare module 'better-auth' {
  export interface User {
    id: string
    name: string
    email: string
    createdAt: Date
    languageCode: string
    group: Group
    notifications: Notification[]
    recentlyViewed: RecentlyViewed[]
    totalStorageSize: number
  }
}

declare module 'better-auth/client' {
  export interface Session {
    user: import('better-auth').User & User
  }
}