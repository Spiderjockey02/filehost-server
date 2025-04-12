import { Notification, Group, RecentlyViewed } from './index';

declare module 'better-auth' {
  export interface User {
    id: string
    name: string
    email: string
    createdAt: Date
    totalStorageSize: number
  }
}

declare module 'better-auth/client' {
  export interface Session {
    user: import('better-auth').User & User
  }
}