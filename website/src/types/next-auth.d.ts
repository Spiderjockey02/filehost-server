import { User } from '../utils/types';

interface Notification {
  id: string
  text: string
  createdAt: Date
}

export interface RecentFiles {
  id: string
  location: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  recentFiles: RecentFiles[]
  group?: {
    id: string
    name: string
    maxStorageSize: string
  }
  Notifications: Notification[]
  totalStorageSize: string

}


declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {

      id: string
    } & User
  }
}
